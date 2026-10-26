import { Payment } from '../models/Payment.js';
import { Sale } from '../models/Sale.js';
import { roundToTwo } from '../services/calculationService.js';
import { logAudit } from '../services/auditService.js';

export const listPayments = async (req, res, next) => {
  try {
    const { saleId, customerId, paymentMethod, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (saleId) filter.sale = saleId;
    if (customerId) filter.customer = customerId;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('sale', 'invoiceNumber totalAmount outstandingBalance saleStatus')
        .populate('customer', 'name phone email')
        .populate('receivedBy', 'name email')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      payments,
    });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { saleId, amount, paymentMethod, paymentType, transactionReference, notes } = req.body;

    const sale = await Sale.findById(saleId).populate('customer');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    if (sale.saleStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payments against a cancelled invoice.',
      });
    }

    const paymentAmount = roundToTwo(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.',
      });
    }

    // Overpayment check
    if (paymentAmount > sale.outstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${paymentAmount}) exceeds the current outstanding balance (₹${sale.outstandingBalance}).`,
        outstandingBalance: sale.outstandingBalance,
      });
    }

    // Create payment entry
    const newPayment = await Payment.create({
      sale: sale._id,
      customer: sale.customer._id,
      amount: paymentAmount,
      paymentType: paymentType || (paymentAmount === sale.outstandingBalance ? 'full_settlement' : 'partial'),
      paymentMethod,
      transactionReference: transactionReference || '',
      paymentDate: new Date(),
      status: 'success',
      receivedBy: req.user._id,
      notes: notes || '',
    });

    // Update sale amounts and status atomically
    const newAmountPaid = roundToTwo(sale.amountPaid + paymentAmount);
    const newOutstandingBalance = roundToTwo(sale.totalAmount - newAmountPaid);
    const newPaymentStatus = newOutstandingBalance <= 0 ? 'paid' : 'partial';

    sale.amountPaid = newAmountPaid;
    sale.outstandingBalance = newOutstandingBalance;
    sale.paymentStatus = newPaymentStatus;
    await sale.save();

    await logAudit({
      action: 'ADD_PAYMENT',
      entity: 'Payment',
      entityId: newPayment._id,
      user: req.user,
      details: `Recorded ₹${paymentAmount} payment (${paymentMethod}) for Invoice ${sale.invoiceNumber}. Remaining balance: ₹${newOutstandingBalance}`,
      ipAddress: req.ip,
    });

    const populatedPayment = await Payment.findById(newPayment._id)
      .populate('sale', 'invoiceNumber totalAmount outstandingBalance paymentStatus')
      .populate('customer', 'name phone')
      .populate('receivedBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment: populatedPayment,
      updatedSale: {
        id: sale._id,
        invoiceNumber: sale.invoiceNumber,
        totalAmount: sale.totalAmount,
        amountPaid: sale.amountPaid,
        outstandingBalance: sale.outstandingBalance,
        paymentStatus: sale.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
