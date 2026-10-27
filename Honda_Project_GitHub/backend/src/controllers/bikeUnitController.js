import { BikeUnit } from '../models/BikeUnit.js';
import { BikeModel } from '../models/BikeModel.js';
import { Sale } from '../models/Sale.js';
import { logAudit } from '../services/auditService.js';
import { escapeRegex } from '../utils/text.js';

export const listBikeUnits = async (req, res, next) => {
  try {
    const { model, status, search, colour, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = {};

    if (model) filter.model = model;
    if (status) filter.status = status;
    if (colour) filter.colour = { $regex: escapeRegex(colour), $options: 'i' };
    if (search) {
      filter.$or = [
        { chassisNumber: { $regex: escapeRegex(search), $options: 'i' } },
        { engineNumber: { $regex: escapeRegex(search), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [units, total] = await Promise.all([
      BikeUnit.find(filter)
        .populate('model', 'modelName variant modelYear category basePrice reorderThreshold colours')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      BikeUnit.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      units,
    });
  } catch (error) {
    next(error);
  }
};

export const getBikeUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const unit = await BikeUnit.findById(id).populate('model');
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Physical bike unit not found',
      });
    }

    // Check if linked to an active sale
    const linkedSale = await Sale.findOne({ bikeUnit: id }).populate('customer', 'name phone email');

    return res.status(200).json({
      success: true,
      unit,
      linkedSale: linkedSale || null,
    });
  } catch (error) {
    next(error);
  }
};

export const createBikeUnit = async (req, res, next) => {
  try {
    const {
      chassisNumber,
      engineNumber,
      model,
      colour,
      variant,
      purchaseDate,
      purchaseCost,
      status = 'available',
      location,
      batteryNumber,
      keyNumber,
      notes,
    } = req.body;

    // Check bike model existence
    const bikeModel = await BikeModel.findById(model);
    if (!bikeModel) {
      return res.status(400).json({
        success: false,
        message: 'Specified bike model does not exist.',
      });
    }

    // Check duplicate chassis or engine number
    const duplicate = await BikeUnit.findOne({
      $or: [
        { chassisNumber: chassisNumber.trim().toUpperCase() },
        { engineNumber: engineNumber.trim().toUpperCase() },
      ],
    });

    if (duplicate) {
      const match = duplicate.chassisNumber === chassisNumber.trim().toUpperCase() ? 'Chassis/VIN' : 'Engine number';
      return res.status(409).json({
        success: false,
        message: `A bike unit with this ${match} already exists in inventory.`,
      });
    }

    const newUnit = await BikeUnit.create({
      chassisNumber: chassisNumber.trim().toUpperCase(),
      engineNumber: engineNumber.trim().toUpperCase(),
      model,
      colour: colour.trim(),
      variant: variant || bikeModel.variant,
      purchaseDate: purchaseDate || new Date(),
      purchaseCost: Number(purchaseCost),
      status,
      location: location || 'Showroom Floor',
      batteryNumber: batteryNumber || '',
      keyNumber: keyNumber || '',
      notes: notes || '',
    });

    await logAudit({
      action: 'ADD_BIKE_UNIT',
      entity: 'BikeUnit',
      entityId: newUnit._id,
      user: req.user,
      details: `Added new ${bikeModel.modelName} unit (VIN: ${newUnit.chassisNumber}, Eng: ${newUnit.engineNumber}, ₹${newUnit.purchaseCost})`,
      ipAddress: req.ip,
    });

    const populated = await BikeUnit.findById(newUnit._id).populate('model');

    return res.status(201).json({
      success: true,
      message: 'Physical bike unit added to inventory successfully',
      unit: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBikeUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { colour, location, batteryNumber, keyNumber, notes, status, purchaseCost } = req.body;

    const unit = await BikeUnit.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Physical bike unit not found',
      });
    }

    // If attempting to change status of a sold unit
    if (unit.status === 'sold' && status && status !== 'sold') {
      const activeSale = await Sale.findOne({ bikeUnit: id, saleStatus: 'confirmed' });
      if (activeSale) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change status of a sold unit that is linked to an active confirmed invoice.',
        });
      }
    }

    if (colour) unit.colour = colour.trim();
    if (location) unit.location = location.trim();
    if (batteryNumber !== undefined) unit.batteryNumber = batteryNumber.trim();
    if (keyNumber !== undefined) unit.keyNumber = keyNumber.trim();
    if (notes !== undefined) unit.notes = notes.trim();
    if (purchaseCost !== undefined) unit.purchaseCost = Number(purchaseCost);
    if (status && ['available', 'reserved', 'sold'].includes(status)) {
      unit.status = status;
    }

    await unit.save();
    const populated = await BikeUnit.findById(unit._id).populate('model');

    await logAudit({
      action: 'UPDATE_BIKE_UNIT',
      entity: 'BikeUnit',
      entityId: unit._id,
      user: req.user,
      details: `Updated bike unit ${unit.chassisNumber} status: ${unit.status}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Bike unit updated successfully',
      unit: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBikeUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const unit = await BikeUnit.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Bike unit not found',
      });
    }

    // Prevent deletion if linked to sale
    const linkedSale = await Sale.findOne({ bikeUnit: id });
    if (linkedSale) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete bike unit ${unit.chassisNumber} because it is linked to Invoice ${linkedSale.invoiceNumber}.`,
      });
    }

    await BikeUnit.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE_BIKE_UNIT',
      entity: 'BikeUnit',
      entityId: id,
      user: req.user,
      details: `Deleted bike unit (VIN: ${unit.chassisNumber})`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Bike unit deleted from inventory successfully',
    });
  } catch (error) {
    next(error);
  }
};
