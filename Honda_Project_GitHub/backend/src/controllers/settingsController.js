import { ShowroomSettings } from '../models/ShowroomSettings.js';
import { logAudit } from '../services/auditService.js';
import { User } from '../models/User.js';
import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { Enquiry } from '../models/Enquiry.js';
import { TestRide } from '../models/TestRide.js';
import { BikeUnit } from '../models/BikeUnit.js';
import { BikeModel } from '../models/BikeModel.js';

export const getShowroomSettings = async (req, res, next) => {
  try {
    let settings = await ShowroomSettings.findOne();
    if (!settings) {
      settings = await ShowroomSettings.create({
        showroomName: 'Apex Honda Motors',
        tagline: 'Authorized Honda 2-Wheelers Sales & Service',
        dealerCode: 'HND-BLR-042',
        address: '#42, Ring Road, Outer Ring Road Junction',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560048',
        phone: '+91 80 4123 4567',
        email: 'sales@apexhonda.example.com',
        gstin: '29AABCH1234F1Z5',
        invoicePrefix: 'HND-2026',
        nextInvoiceNumber: 1001,
        defaultGstRate: 28,
        defaultInsuranceRate: 5500,
        defaultRtoCharge: 8500,
        defaultReorderThreshold: 3,
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateShowroomSettings = async (req, res, next) => {
  try {
    const updateData = { ...req.body, updatedBy: req.user._id };

    let settings = await ShowroomSettings.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    await logAudit({
      action: 'UPDATE_SETTINGS',
      entity: 'ShowroomSettings',
      entityId: settings._id,
      user: req.user,
      details: `Showroom settings updated by ${req.user.name}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Showroom configuration updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// Go-live: remove all demo / test records so the showroom starts with a clean book.
// Keeps user logins, showroom settings and (optionally) the bike model price list.
export const clearBusinessData = async (req, res, next) => {
  try {
    const { confirmText, password, keepModels = true } = req.body;
    if (confirmText !== 'DELETE ALL DATA') {
      return res.status(400).json({ success: false, message: 'Type DELETE ALL DATA exactly to confirm.' });
    }
    const admin = await User.findById(req.user._id);
    if (!admin || !(await admin.comparePassword(password || ''))) {
      return res.status(400).json({ success: false, message: 'Your password is wrong.' });
    }

    const results = await Promise.all([
      Sale.deleteMany({}),
      Payment.deleteMany({}),
      Customer.deleteMany({}),
      Enquiry.deleteMany({}),
      TestRide.deleteMany({}),
      BikeUnit.deleteMany({}),
      keepModels ? Promise.resolve({ deletedCount: 0 }) : BikeModel.deleteMany({}),
    ]);
    await ShowroomSettings.updateOne({}, { $set: { nextInvoiceNumber: 1001 } });

    const [sales, payments, customers, enquiries, testRides, units, models] = results.map((r) => r.deletedCount || 0);
    await logAudit({
      action: 'DATA_CLEARED',
      entity: 'ShowroomSettings',
      user: req.user,
      details: `Cleared business data: ${sales} sales, ${payments} payments, ${customers} customers, ${enquiries} enquiries, ${testRides} test rides, ${units} stock units${keepModels ? '' : `, ${models} models`}. Invoice numbers restart at 1001.`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'All demo data cleared. The showroom is ready for real billing.',
      cleared: { sales, payments, customers, enquiries, testRides, units, models },
    });
  } catch (error) {
    next(error);
  }
};
