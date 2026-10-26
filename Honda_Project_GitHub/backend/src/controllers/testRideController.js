import { TestRide } from '../models/TestRide.js';
import { Customer } from '../models/Customer.js';
import { BikeModel } from '../models/BikeModel.js';
import { logAudit } from '../services/auditService.js';

export const listTestRides = async (req, res, next) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.scheduledDate = { $gte: start, $lte: end };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [testRides, total] = await Promise.all([
      TestRide.find(filter)
        .populate('customer', 'name phone email')
        .populate('bikeModel', 'modelName variant colours')
        .populate('bikeUnit', 'chassisNumber colour')
        .populate('handledBy', 'name email')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      TestRide.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      testRides,
    });
  } catch (error) {
    next(error);
  }
};

export const createTestRide = async (req, res, next) => {
  try {
    const { customer, bikeModel, bikeUnit, scheduledDate, timeSlot, licenseNumber, remarks } = req.body;

    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const modelDoc = await BikeModel.findById(bikeModel);
    if (!modelDoc) {
      return res.status(404).json({ success: false, message: 'Bike model not found' });
    }

    // Booking conflict validation: Check if this customer or bike model slot is already booked
    const rideDate = new Date(scheduledDate);
    const dayStart = new Date(rideDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(rideDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflict = await TestRide.findOne({
      customer,
      timeSlot,
      scheduledDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['scheduled', 'in_progress'] },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Customer already has an active test ride booked for ${timeSlot} on this date.`,
      });
    }

    const testRide = await TestRide.create({
      customer,
      bikeModel,
      bikeUnit: bikeUnit || null,
      scheduledDate: rideDate,
      timeSlot,
      licenseNumber: licenseNumber.trim().toUpperCase(),
      feedback: remarks || '',
      handledBy: req.user?._id,
      status: 'scheduled',
    });

    await logAudit({
      action: 'BOOK_TEST_RIDE',
      entity: 'TestRide',
      entityId: testRide._id,
      user: req.user,
      details: `Booked test ride for ${customerDoc.name} on ${modelDoc.modelName} at ${timeSlot}`,
      ipAddress: req.ip,
    });

    const populated = await TestRide.findById(testRide._id)
      .populate('customer', 'name phone email')
      .populate('bikeModel', 'modelName variant colours')
      .populate('handledBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Test ride scheduled successfully',
      testRide: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTestRide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, feedback, handledBy, timeSlot, scheduledDate } = req.body;

    const testRide = await TestRide.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(feedback !== undefined && { feedback }),
        ...(handledBy && { handledBy }),
        ...(timeSlot && { timeSlot }),
        ...(scheduledDate && { scheduledDate }),
      },
      { new: true, runValidators: true }
    )
      .populate('customer', 'name phone email')
      .populate('bikeModel', 'modelName variant colours')
      .populate('handledBy', 'name email');

    if (!testRide) {
      return res.status(404).json({ success: false, message: 'Test ride booking not found' });
    }

    await logAudit({
      action: 'UPDATE_TEST_RIDE',
      entity: 'TestRide',
      entityId: testRide._id,
      user: req.user,
      details: `Test ride status updated to ${testRide.status}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Test ride booking updated successfully',
      testRide,
    });
  } catch (error) {
    next(error);
  }
};
