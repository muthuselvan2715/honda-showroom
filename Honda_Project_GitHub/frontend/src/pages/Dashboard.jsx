import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bike,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { formatINR, formatDate } from '../utils/formatters';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dealership dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-red-900">Database Connection Required</h3>
        <p className="text-sm text-red-700 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, lowStockAlerts = [], modelWiseSales = [], salesTrend = [], recentInvoices = [], recentActivities = [] } = data || {};

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dealership Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time physical inventory, billing metrics, and revenue analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/sales/new"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Sale</span>
          </Link>
          <Link
            to="/inventory"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Bike className="w-4 h-4 text-slate-500" />
            <span>Manage Inventory</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Physical Inventory"
          value={metrics?.inventory?.totalPhysicalUnits || 0}
          subtitle={`${metrics?.inventory?.available || 0} Available • ${metrics?.inventory?.reserved || 0} Reserved`}
          icon={Bike}
          color="red"
        />
        <StatCard
          title="Revenue Collected"
          value={formatINR(metrics?.sales?.revenueCollected || 0)}
          subtitle="Sum of completed payments"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Invoiced Value"
          value={formatINR(metrics?.sales?.totalInvoiceValue || 0)}
          subtitle={`${metrics?.sales?.monthlyCompletedSales || 0} Sales this month`}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Customer Receivables"
          value={formatINR(metrics?.sales?.outstandingCustomerBalances || 0)}
          subtitle="Outstanding customer balances"
          icon={Wallet}
          color="amber"
        />
      </div>

      {/* Low Stock Warning Banner if any model is below reorder threshold */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Low Stock Reorder Alerts ({lowStockAlerts.length} Models)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockAlerts.map((alert) => (
              <div
                key={alert.modelId}
                className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {alert.modelName} <span className="text-slate-500 font-normal">({alert.variant})</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Category: <span className="font-medium text-slate-700">{alert.category}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    {alert.available} in stock
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Min: {alert.reorderThreshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Sales Revenue Trend</h3>
              <p className="text-xs text-slate-500">Gross invoiced volume over recent months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="h-64 w-full">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Revenue']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly sales history recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Model-Wise Sales Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Model-Wise Units Sold</h3>
              <p className="text-xs text-slate-500">Top demanded motorcycle models</p>
            </div>
            <Bike className="w-4 h-4 text-slate-500" />
          </div>
          <div className="h-64 w-full">
            {modelWiseSales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelWiseSales} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="modelName"
                    stroke="#94a3b8"
                    fontSize={10}
                    width={110}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} units`, 'Units Sold']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px' }}
                  />
                  <Bar dataKey="unitsSold" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No model-wise sales records to display.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Section: Recent Invoices & Stock Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Invoices</h3>
              <p className="text-xs text-slate-500">Latest sales created in the system</p>
            </div>
            <Link
              to="/sales"
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{inv.customer?.name}</span>
                        <span className="text-[11px] text-slate-400">{inv.customer?.phone}</span>
                      </td>
                      <td className="py-3 px-4">
                        {inv.bikeModel?.modelName} {inv.bikeModel?.variant}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatINR(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatINR(inv.outstandingBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={inv.paymentStatus} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No invoices recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Activity Feed (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Showroom Logs</h3>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3.5 overflow-y-auto max-h-[340px] pr-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act._id} className="text-xs border-b border-slate-50 pb-2.5 last:border-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      {act.action?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(act.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{act.details}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    By: {act.userName}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No recent audit logs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
