import { Enquiry } from '../models/Enquiry.js';
import { Customer } from '../models/Customer.js';
import { BikeModel } from '../models/BikeModel.js';
import { logAudit } from '../services/auditService.js';

export const listEnquiries = async (req, res, next) => {
  try {
    const { status, bikeModel, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (bikeModel) filter.bikeModel = bikeModel;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .populate('customer', 'name phone email city')
        .populate('bikeModel', 'modelName variant basePrice')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      enquiries,
    });
  } catch (error) {
    next(error);
  }
};

export const createEnquiry = async (req, res, next) => {
  try {
    const { customer, bikeModel, status = 'new', source = 'Walk-in', notes, followUpDate, assignedTo } = req.body;

    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const modelExists = await BikeModel.findById(bikeModel);
    if (!modelExists) {
      return res.status(404).json({ success: false, message: 'Bike model not found' });
    }

    const enquiry = await Enquiry.create({
      customer,
      bikeModel,
      status,
      source,
      notes: notes || '',
      followUpDate: followUpDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // default +3 days
      assignedTo: assignedTo || req.user?._id,
    });

    await logAudit({
      action: 'CREATE_ENQUIRY',
      entity: 'Enquiry',
      entityId: enquiry._id,
      user: req.user,
      details: `New enquiry for ${modelExists.modelName} from ${customerExists.name}`,
      ipAddress: req.ip,
    });

    const populated = await Enquiry.findById(enquiry._id)
      .populate('customer', 'name phone email')
      .populate('bikeModel', 'modelName variant basePrice')
      .populate('assignedTo', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Enquiry logged successfully',
      enquiry: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, followUpDate, assignedTo, bikeModel } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(followUpDate && { followUpDate }),
        ...(assignedTo && { assignedTo }),
        ...(bikeModel && { bikeModel }),
      },
      { new: true, runValidators: true }
    )
      .populate('customer', 'name phone email')
      .populate('bikeModel', 'modelName variant basePrice')
      .populate('assignedTo', 'name email');

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    await logAudit({
      action: 'UPDATE_ENQUIRY',
      entity: 'Enquiry',
      entityId: enquiry._id,
      user: req.user,
      details: `Updated enquiry status to ${enquiry.status}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};
