import { Sale } from '../models/Sale.js';
import { BikeUnit } from '../models/BikeUnit.js';
import { BikeModel } from '../models/BikeModel.js';
import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';
import { ShowroomSettings } from '../models/ShowroomSettings.js';
import { calculateSaleTotals, roundToTwo } from '../services/calculationService.js';
import { getNextInvoiceNumber } from '../utils/invoiceGenerator.js';
import { amountInWords } from '../utils/amountWords.js';
import { logAudit } from '../services/auditService.js';
import { escapeRegex } from '../utils/text.js';

export const listSales = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'saleDate',
      order = 'desc',
    } = req.query;

    const filter = {};

    if (status) filter.saleStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.saleDate.$lte = end;
      }
    }

    if (search && String(search).trim()) {
      // Search by invoice number, customer name / phone, or chassis number
      const pattern = { $regex: escapeRegex(search), $options: 'i' };
      const [matchingCustomers, matchingUnits] = await Promise.all([
        Customer.find({ $or: [{ name: pattern }, { phone: pattern }] }).select('_id').limit(200),
        BikeUnit.find({ chassisNumber: pattern }).select('_id').limit(200),
      ]);
      filter.$or = [
        { invoiceNumber: pattern },
        { customer: { $in: matchingCustomers.map((c) => c._id) } },
        { bikeUnit: { $in: matchingUnits.map((u) => u._id) } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('customer', 'name phone email city')
        .populate('bikeModel', 'modelName variant colours basePrice')
        .populate('bikeUnit', 'chassisNumber engineNumber colour status')
        .populate('soldBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Sale.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      sales,
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id)
      .populate('customer')
      .populate('bikeModel')
      .populate('bikeUnit')
      .populate('soldBy', 'name email role');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale invoice not found',
      });
    }

    // Retrieve all payment history for this sale
    const payments = await Payment.find({ sale: id }).populate('receivedBy', 'name email').sort({ paymentDate: -1 });

    // Showroom settings for print branding
    const settings = (await ShowroomSettings.findOne()) || {
      showroomName: 'Apex Honda Motors',
      tagline: 'Authorized Honda 2-Wheelers Sales & Service',
      address: '#42, Ring Road, Mahadevapura',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560048',
      phone: '+91 80 4123 4567',
      email: 'sales@apexhonda.example.com',
      gstin: '29AABCH1234F1Z5',
    };

    return res.status(200).json({
      success: true,
      sale,
      payments,
      amountInWords: amountInWords(sale.totalAmount),
      showroom: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const createSale = async (req, res, next) => {
  let reservedUnit = null;

  try {
    const {
      customerId,
      newCustomer,
      bikeUnitId,
      insuranceCharge = 0,
      rtoRegistrationCharge = 0,
      accessoriesList = [],
      discountAmount = 0,
      advancePayment = 0,
      paymentMethod = 'cash',
      paymentReference = '',
      notes = '',
      financeProvider = '',
    } = req.body;

    // 1. Resolve or register customer
    let customer;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Specified customer not found' });
      }
    } else if (newCustomer) {
      const settings0 = await ShowroomSettings.findOne().select('city state');
      const existing = await Customer.findOne({ phone: newCustomer.phone?.trim() });
      if (existing) {
        customer = existing;
      } else {
        customer = await Customer.create({
          name: newCustomer.name?.trim(),
          phone: newCustomer.phone?.trim(),
          email: newCustomer.email?.trim() || '',
          address: newCustomer.address?.trim() || 'Showroom Counter',
          city: newCustomer.city?.trim() || settings0?.city || '',
          state: newCustomer.state?.trim() || settings0?.state || 'Tamil Nadu',
          pincode: newCustomer.pincode?.trim() || '',
          idProofType: newCustomer.idProofType || 'Aadhaar',
          idProofNumber: newCustomer.idProofNumber || '',
        });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Customer information is required' });
    }

    // 2. Fetch showroom settings for defaults
    const settings = await ShowroomSettings.findOne();
    const gstRate = settings?.defaultGstRate || 28;

    // 3. ATOMIC UNIT ALLOCATION (Concurrency & Duplicate Prevention):
    // Atomically find unit with status 'available' and mark it as 'sold'
    reservedUnit = await BikeUnit.findOneAndUpdate(
      { _id: bikeUnitId, status: 'available' },
      { status: 'sold' },
      { new: true }
    ).populate('model');

    if (!reservedUnit) {
      return res.status(409).json({
        success: false,
        message: 'This physical bike unit is no longer available in inventory (it may be sold or reserved).',
      });
    }

    const bikeModel = reservedUnit.model;
    if (!bikeModel) {
      // Compensation rollback
      await BikeUnit.findByIdAndUpdate(bikeUnitId, { status: 'available' });
      return res.status(400).json({ success: false, message: 'Model information missing on physical unit' });
    }

    // 4. Server-Side Calculations (NEVER trust frontend calculations)
    const financialBreakdown = calculateSaleTotals({
      exShowroomPrice: bikeModel.basePrice,
      insuranceCharge: Number(insuranceCharge),
      rtoRegistrationCharge: Number(rtoRegistrationCharge),
      accessoriesList: Array.isArray(accessoriesList) ? accessoriesList : [],
      discountAmount: Number(discountAmount),
      gstRate,
    });

    const advance = Math.max(0, roundToTwo(advancePayment));
    if (advance > financialBreakdown.totalAmount) {
      // Rollback unit
      await BikeUnit.findByIdAndUpdate(bikeUnitId, { status: 'available' });
      return res.status(400).json({
        success: false,
        message: `Advance payment (₹${advance}) cannot exceed total invoice amount (₹${financialBreakdown.totalAmount}).`,
      });
    }

    const outstandingBalance = roundToTwo(financialBreakdown.totalAmount - advance);
    let paymentStatus = 'pending';
    if (advance > 0) {
      paymentStatus = outstandingBalance === 0 ? 'paid' : 'partial';
    }

    // 5. Generate unique invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // 6. Create Sale record
    const sale = await Sale.create({
      invoiceNumber,
      customer: customer._id,
      bikeUnit: reservedUnit._id,
      bikeModel: bikeModel._id,
      soldBy: req.user._id,
      saleDate: new Date(),
      ...financialBreakdown,
      // Save the individual accessory lines so they can be printed on the invoice
      accessoriesList: (Array.isArray(accessoriesList) ? accessoriesList : [])
        .filter((item) => item && String(item.name || '').trim() !== '')
        .map((item) => ({
          name: String(item.name).trim(),
          price: Math.max(0, roundToTwo(item.price || 0)),
        })),
      amountPaid: advance,
      outstandingBalance,
      paymentStatus,
      saleStatus: 'confirmed',
      financeProvider: String(financeProvider || '').trim().slice(0, 120),
      notes,
    });

    // 7. Record advance payment if provided
    let initialPayment = null;
    if (advance > 0) {
      initialPayment = await Payment.create({
        sale: sale._id,
        customer: customer._id,
        amount: advance,
        paymentType: outstandingBalance === 0 ? 'full_settlement' : 'advance',
        paymentMethod: paymentMethod || 'cash',
        transactionReference: paymentReference || `ADV-${invoiceNumber}`,
        paymentDate: new Date(),
        status: 'success',
        receivedBy: req.user._id,
        notes: `Initial payment at invoice creation for ${invoiceNumber}`,
      });
    }

    await logAudit({
      action: 'CREATE_SALE',
      entity: 'Sale',
      entityId: sale._id,
      user: req.user,
      details: `Generated Invoice ${sale.invoiceNumber} for ${customer.name} (Unit VIN: ${reservedUnit.chassisNumber}, Total: ₹${sale.totalAmount}, Paid: ₹${advance})`,
      ipAddress: req.ip,
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer')
      .populate('bikeModel')
      .populate('bikeUnit')
      .populate('soldBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Sale confirmed and invoice generated successfully',
      sale: populatedSale,
      payment: initialPayment,
    });
  } catch (error) {
    // Compensation rollback in case of any unhandled error during creation
    if (reservedUnit) {
      try {
        await BikeUnit.findByIdAndUpdate(reservedUnit._id, { status: 'available' });
      } catch (rollbackErr) {
        console.error('[Rollback Error] Failed to restore unit status:', rollbackErr.message);
      }
    }
    next(error);
  }
};

export const cancelSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const sale = await Sale.findById(id).populate('bikeUnit');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    if (sale.saleStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This sale has already been cancelled.' });
    }

    // Release the physical bike unit back to 'available'
    if (sale.bikeUnit) {
      await BikeUnit.findByIdAndUpdate(sale.bikeUnit._id, { status: 'available' });
    }

    sale.saleStatus = 'cancelled';
    sale.cancellationReason = reason || 'Cancelled by manager';
    await sale.save();

    // Money received on a cancelled invoice is returned to the customer:
    // mark those payments as refunded so they are no longer counted as collected
    const refund = await Payment.updateMany({ sale: sale._id, status: 'success' }, { $set: { status: 'refunded' } });
    const refundedCount = refund.modifiedCount ?? refund.nModified ?? 0;

    await logAudit({
      action: 'CANCEL_SALE',
      entity: 'Sale',
      entityId: sale._id,
      user: req.user,
      details: `Cancelled Invoice ${sale.invoiceNumber}. Reason: ${sale.cancellationReason}. Bike unit ${sale.bikeUnit?.chassisNumber || ''} restored to available.${refundedCount ? ` ${refundedCount} payment(s) of ₹${sale.amountPaid} marked as refunded.` : ''}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Sale ${sale.invoiceNumber} has been cancelled and physical unit is restored to inventory.`,
      sale,
    });
  } catch (error) {
    next(error);
  }
};
