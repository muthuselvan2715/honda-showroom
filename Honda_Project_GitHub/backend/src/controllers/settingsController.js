import { ShowroomSettings } from '../models/ShowroomSettings.js';
import { logAudit } from '../services/auditService.js';

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
