import { Customer } from '../models/Customer.js';
import { Sale } from '../models/Sale.js';
import { Enquiry } from '../models/Enquiry.js';
import { TestRide } from '../models/TestRide.js';
import { logAudit } from '../services/auditService.js';

export const listCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { city: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort(sort).skip(skip).limit(limitNum),
      Customer.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Load customer purchase history, enquiries, and test rides
    const [sales, enquiries, testRides] = await Promise.all([
      Sale.find({ customer: id })
        .populate('bikeModel', 'modelName variant modelYear')
        .populate('bikeUnit', 'chassisNumber engineNumber colour')
        .sort({ saleDate: -1 }),
      Enquiry.find({ customer: id })
        .populate('bikeModel', 'modelName variant')
        .sort({ createdAt: -1 }),
      TestRide.find({ customer: id })
        .populate('bikeModel', 'modelName variant')
        .sort({ scheduledDate: -1 }),
    ]);

    return res.status(200).json({
      success: true,
      customer,
      sales,
      enquiries,
      testRides,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, city, state, pincode, idProofType, idProofNumber, notes } = req.body;

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A customer with phone number ${phone} is already registered (${existing.name}).`,
        customer: existing,
      });
    }

    const newCustomer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : '',
      address: address.trim(),
      city: city ? city.trim() : 'Bengaluru',
      state: state ? state.trim() : 'Karnataka',
      pincode: pincode ? pincode.trim() : '',
      idProofType: idProofType || 'Aadhaar',
      idProofNumber: idProofNumber ? idProofNumber.trim() : '',
      notes: notes || '',
    });

    await logAudit({
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: newCustomer._id,
      user: req.user,
      details: `Registered customer ${newCustomer.name} (${newCustomer.phone})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: newCustomer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, city, state, pincode, idProofType, idProofNumber, notes } = req.body;

    if (phone) {
      const existing = await Customer.findOne({ phone: phone.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Phone number ${phone} is already used by another customer (${existing.name}).`,
        });
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(address && { address: address.trim() }),
        ...(city && { city: city.trim() }),
        ...(state && { state: state.trim() }),
        ...(pincode !== undefined && { pincode: pincode.trim() }),
        ...(idProofType && { idProofType }),
        ...(idProofNumber !== undefined && { idProofNumber: idProofNumber.trim() }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    await logAudit({
      action: 'UPDATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id,
      user: req.user,
      details: `Updated details for customer ${customer.name}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Customer details updated successfully',
      customer,
    });
  } catch (error) {
    next(error);
  }
};
