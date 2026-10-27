import { BikeModel } from '../models/BikeModel.js';
import { BikeUnit } from '../models/BikeUnit.js';
import { logAudit } from '../services/auditService.js';
import { escapeRegex } from '../utils/text.js';

export const listBikeModels = async (req, res, next) => {
  try {
    const { category, search, activeOnly } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (activeOnly === 'true') filter.isActive = true;
    if (search) {
      filter.$or = [
        { modelName: { $regex: escapeRegex(search), $options: 'i' } },
        { variant: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    const models = await BikeModel.find(filter).sort({ modelName: 1, variant: 1 });

    // Derive physical unit counts for each model directly from BikeUnit collection
    const unitStats = await BikeUnit.aggregate([
      {
        $group: {
          _id: { model: '$model', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const statMap = {};
    unitStats.forEach((stat) => {
      const modelId = stat._id.model.toString();
      const status = stat._id.status;
      if (!statMap[modelId]) {
        statMap[modelId] = { available: 0, reserved: 0, sold: 0, total: 0 };
      }
      statMap[modelId][status] = stat.count;
      statMap[modelId].total += stat.count;
    });

    const modelsWithStock = models.map((m) => {
      const stats = statMap[m._id.toString()] || { available: 0, reserved: 0, sold: 0, total: 0 };
      const isLowStock = stats.available <= m.reorderThreshold;
      return {
        ...m.toObject(),
        stock: {
          available: stats.available,
          reserved: stats.reserved,
          sold: stats.sold,
          total: stats.total,
          isLowStock,
        },
      };
    });

    return res.status(200).json({
      success: true,
      count: modelsWithStock.length,
      bikeModels: modelsWithStock,
    });
  } catch (error) {
    next(error);
  }
};

export const getBikeModelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const model = await BikeModel.findById(id);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Bike model not found',
      });
    }

    const units = await BikeUnit.find({ model: id }).sort({ createdAt: -1 });
    const availableCount = units.filter((u) => u.status === 'available').length;
    const reservedCount = units.filter((u) => u.status === 'reserved').length;
    const soldCount = units.filter((u) => u.status === 'sold').length;

    return res.status(200).json({
      success: true,
      bikeModel: {
        ...model.toObject(),
        stock: {
          available: availableCount,
          reserved: reservedCount,
          sold: soldCount,
          total: units.length,
          isLowStock: availableCount <= model.reorderThreshold,
        },
        units,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createBikeModel = async (req, res, next) => {
  try {
    const {
      modelName,
      variant,
      modelYear,
      category,
      colours,
      engineCapacityCc,
      fuelType,
      basePrice,
      reorderThreshold,
      description,
      imageUrl,
    } = req.body;

    const existing = await BikeModel.findOne({
      modelName: { $regex: new RegExp(`^${escapeRegex(modelName)}$`, 'i') },
      variant: { $regex: new RegExp(`^${escapeRegex(variant)}$`, 'i') },
      modelYear,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Bike model '${modelName} - ${variant} (${modelYear})' already exists.`,
      });
    }

    const newModel = await BikeModel.create({
      modelName,
      variant,
      modelYear,
      category,
      colours,
      engineCapacityCc,
      fuelType,
      basePrice,
      reorderThreshold: reorderThreshold || 3,
      description,
      imageUrl,
    });

    await logAudit({
      action: 'CREATE_BIKE_MODEL',
      entity: 'BikeModel',
      entityId: newModel._id,
      user: req.user,
      details: `Created model ${newModel.modelName} ${newModel.variant} (₹${newModel.basePrice})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Bike model created successfully',
      bikeModel: newModel,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBikeModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await BikeModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Bike model not found',
      });
    }

    await logAudit({
      action: 'UPDATE_BIKE_MODEL',
      entity: 'BikeModel',
      entityId: updated._id,
      user: req.user,
      details: `Updated model specifications for ${updated.modelName} ${updated.variant}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Bike model updated successfully',
      bikeModel: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBikeModel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const model = await BikeModel.findById(id);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Bike model not found',
      });
    }

    // Check if physical units are attached
    const unitCount = await BikeUnit.countDocuments({ model: id });
    if (unitCount > 0) {
      // Soft-delete/deactivate instead
      model.isActive = false;
      await model.save();

      await logAudit({
        action: 'DEACTIVATE_BIKE_MODEL',
        entity: 'BikeModel',
        entityId: model._id,
        user: req.user,
        details: `Deactivated model ${model.modelName} (${unitCount} inventory units linked)`,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: `Model has ${unitCount} physical inventory units attached. It has been deactivated instead of permanently deleted.`,
        bikeModel: model,
      });
    }

    await BikeModel.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE_BIKE_MODEL',
      entity: 'BikeModel',
      entityId: id,
      user: req.user,
      details: `Deleted model ${model.modelName} ${model.variant}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Bike model deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
