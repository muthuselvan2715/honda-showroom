import { BikeUnit } from '../models/BikeUnit.js';
import { BikeModel } from '../models/BikeModel.js';
import { Sale } from '../models/Sale.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { AuditLog } from '../models/AuditLog.js';
import { roundToTwo } from '../services/calculationService.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // 1. Inventory Unit Counts (Derived strictly from physical units)
    const [totalUnits, availableUnits, reservedUnits, soldUnits] = await Promise.all([
      BikeUnit.countDocuments(),
      BikeUnit.countDocuments({ status: 'available' }),
      BikeUnit.countDocuments({ status: 'reserved' }),
      BikeUnit.countDocuments({ status: 'sold' }),
    ]);

    // 2. Sales Counts & Totals (Excluding cancelled sales)
    const [todaySalesCount, monthSalesCount, totalConfirmedSales] = await Promise.all([
      Sale.countDocuments({ saleDate: { $gte: todayStart }, saleStatus: 'confirmed' }),
      Sale.countDocuments({ saleDate: { $gte: monthStart }, saleStatus: 'confirmed' }),
      Sale.find({ saleStatus: 'confirmed' }).select('totalAmount amountPaid outstandingBalance'),
    ]);

    const totalInvoiceValue = roundToTwo(
      totalConfirmedSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0)
    );

    const totalOutstandingBalance = roundToTwo(
      totalConfirmedSales.reduce((acc, sale) => acc + (sale.outstandingBalance || 0), 0)
    );

    // 3. Real Revenue Collected (Sum of actual successful payment transactions)
    const successfulPayments = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const revenueCollected = roundToTwo(successfulPayments[0]?.totalRevenue || 0);

    // 4. Low Stock Alerts
    const allModels = await BikeModel.find({ isActive: true });
    const availableByModel = await BikeUnit.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: '$model', count: { $sum: 1 } } },
    ]);

    const availableMap = {};
    availableByModel.forEach((item) => {
      availableMap[item._id.toString()] = item.count;
    });

    const lowStockAlerts = [];
    allModels.forEach((model) => {
      const available = availableMap[model._id.toString()] || 0;
      if (available <= model.reorderThreshold) {
        lowStockAlerts.push({
          modelId: model._id,
          modelName: model.modelName,
          variant: model.variant,
          available,
          reorderThreshold: model.reorderThreshold,
          category: model.category,
        });
      }
    });

    // 5. Model-Wise Sales Chart Data
    const modelSalesGroups = await Sale.aggregate([
      { $match: { saleStatus: 'confirmed' } },
      { $group: { _id: '$bikeModel', unitsSold: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const modelById = new Map(allModels.map((m) => [m._id.toString(), m]));
    const modelSalesData = modelSalesGroups
      .map((g) => {
        const m = g._id ? modelById.get(g._id.toString()) : null;
        return m
          ? { _id: g._id, modelName: `${m.modelName} - ${m.variant}`, unitsSold: g.unitsSold, totalRevenue: g.totalRevenue }
          : null;
      })
      .filter(Boolean)
      .sort((x, y) => y.unitsSold - x.unitsSold)
      .slice(0, 7);

    // 6. Sales Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentConfirmedSales = await Sale.find(
      { saleStatus: 'confirmed', saleDate: { $gte: sixMonthsAgo } },
      { saleDate: 1, totalAmount: 1 }
    ).lean();
    const trendMap = new Map();
    recentConfirmedSales.forEach((sale) => {
      const d = new Date(sale.saleDate);
      const key = d.getFullYear() * 100 + d.getMonth() + 1;
      const entry = trendMap.get(key) || { _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, salesCount: 0, totalRevenue: 0 };
      entry.salesCount += 1;
      entry.totalRevenue += sale.totalAmount || 0;
      trendMap.set(key, entry);
    });
    const salesTrend = [...trendMap.keys()].sort((x, y) => x - y).map((k) => trendMap.get(k));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrend = salesTrend.map((item) => ({
      period: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      sales: item.salesCount,
      revenue: roundToTwo(item.totalRevenue),
    }));

    // 7. Recent Invoices
    const recentInvoices = await Sale.find()
      .populate('customer', 'name phone')
      .populate('bikeModel', 'modelName variant')
      .sort({ saleDate: -1 })
      .limit(6);

    // 8. Recent Stock & Sales Activities (from AuditLog)
    const recentActivities = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8);

    return res.status(200).json({
      success: true,
      metrics: {
        inventory: {
          totalPhysicalUnits: totalUnits,
          available: availableUnits,
          reserved: reservedUnits,
          sold: soldUnits,
        },
        sales: {
          todayCompletedSales: todaySalesCount,
          monthlyCompletedSales: monthSalesCount,
          totalInvoiceValue,
          revenueCollected, // strictly payment sum
          outstandingCustomerBalances: totalOutstandingBalance,
        },
      },
      lowStockAlerts,
      modelWiseSales: modelSalesData,
      salesTrend: formattedTrend,
      recentInvoices,
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
};
