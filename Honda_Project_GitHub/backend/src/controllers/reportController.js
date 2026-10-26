import { Sale } from '../models/Sale.js';
import { BikeUnit } from '../models/BikeUnit.js';
import { BikeModel } from '../models/BikeModel.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { roundToTwo } from '../services/calculationService.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;
    const filter = { saleStatus: 'confirmed' };

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.saleDate.$lte = end;
      }
    }

    const sales = await Sale.find(filter)
      .populate('customer', 'name phone email city')
      .populate('bikeModel', 'modelName variant')
      .populate('bikeUnit', 'chassisNumber engineNumber colour')
      .populate('soldBy', 'name')
      .sort({ saleDate: -1 });

    const totalRevenue = roundToTwo(sales.reduce((sum, s) => sum + s.totalAmount, 0));
    const totalCollected = roundToTwo(sales.reduce((sum, s) => sum + s.amountPaid, 0));
    const totalOutstanding = roundToTwo(sales.reduce((sum, s) => sum + s.outstandingBalance, 0));

    if (format === 'csv') {
      let csv = 'Invoice Number,Date,Customer,Phone,Model,Variant,Chassis Number,Base Price,GST,Total Amount,Paid,Outstanding,Payment Status\n';
      sales.forEach((s) => {
        csv += `"${s.invoiceNumber}","${s.saleDate ? new Date(s.saleDate).toLocaleDateString() : ''}","${s.customer?.name || ''}","${s.customer?.phone || ''}","${s.bikeModel?.modelName || ''}","${s.bikeModel?.variant || ''}","${s.bikeUnit?.chassisNumber || ''}",${s.exShowroomPrice},${s.totalTaxAmount},${s.totalAmount},${s.amountPaid},${s.outstandingBalance},"${s.paymentStatus}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      count: sales.length,
      summary: {
        totalRevenue,
        totalCollected,
        totalOutstanding,
      },
      sales,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const { status, format } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const units = await BikeUnit.find(filter)
      .populate('model', 'modelName variant modelYear category basePrice reorderThreshold')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      let csv = 'Chassis / VIN,Engine Number,Model,Variant,Year,Colour,Status,Purchase Cost,Base Price,Location,Entry Date\n';
      units.forEach((u) => {
        csv += `"${u.chassisNumber}","${u.engineNumber}","${u.model?.modelName || ''}","${u.variant}","${u.model?.modelYear || ''}","${u.colour}","${u.status}",${u.purchaseCost},${u.model?.basePrice || 0},"${u.location}","${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_report.csv"');
      return res.status(200).send(csv);
    }

    const availableCount = units.filter((u) => u.status === 'available').length;
    const reservedCount = units.filter((u) => u.status === 'reserved').length;
    const soldCount = units.filter((u) => u.status === 'sold').length;

    return res.status(200).json({
      success: true,
      count: units.length,
      summary: {
        totalUnits: units.length,
        available: availableCount,
        reserved: reservedCount,
        sold: soldCount,
      },
      units,
    });
  } catch (error) {
    next(error);
  }
};

export const getOutstandingBalancesReport = async (req, res, next) => {
  try {
    const { format } = req.query;

    const sales = await Sale.find({
      saleStatus: 'confirmed',
      outstandingBalance: { $gt: 0 },
    })
      .populate('customer', 'name phone email address')
      .populate('bikeModel', 'modelName variant')
      .sort({ outstandingBalance: -1 });

    const totalOutstanding = roundToTwo(sales.reduce((sum, s) => sum + s.outstandingBalance, 0));

    if (format === 'csv') {
      let csv = 'Invoice Number,Customer Name,Phone,Email,Model,Total Amount,Amount Paid,Outstanding Balance,Payment Status\n';
      sales.forEach((s) => {
        csv += `"${s.invoiceNumber}","${s.customer?.name || ''}","${s.customer?.phone || ''}","${s.customer?.email || ''}","${s.bikeModel?.modelName || ''}",${s.totalAmount},${s.amountPaid},${s.outstandingBalance},"${s.paymentStatus}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="outstanding_balances.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      count: sales.length,
      totalOutstanding,
      sales,
    });
  } catch (error) {
    next(error);
  }
};
