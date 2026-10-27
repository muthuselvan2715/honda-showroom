import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Wallet, Receipt, Clock, PlusCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { formatINR } from '../utils/formatters';

const Card = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 ${className}`}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

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
      setError(err.response?.data?.message || 'Could not load the dashboard.');
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
        <div className="h-9 bg-slate-200 rounded-lg w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-slate-900">Dashboard could not load</h2>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  const { metrics, lowStockAlerts = [], modelWiseSales = [], salesTrend = [], recentInvoices = [] } = data || {};
  const lastTrendIndex = salesTrend.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Stock, sales and money to collect at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/inventory"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Bike className="w-4 h-4" />
            <span>Inventory</span>
          </Link>
          <Link
            to="/sales/new"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Sale</span>
          </Link>
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bikes in stock"
          value={metrics?.inventory?.available || 0}
          subtitle={`${metrics?.inventory?.reserved || 0} reserved · ${metrics?.inventory?.sold || 0} sold`}
          icon={Bike}
          color="slate"
        />
        <StatCard
          title="Sales this month"
          value={metrics?.sales?.monthlyCompletedSales || 0}
          subtitle={`${metrics?.sales?.todayCompletedSales || 0} today`}
          icon={Receipt}
          color="slate"
        />
        <StatCard
          title="Money collected"
          value={formatINR(metrics?.sales?.revenueCollected || 0)}
          subtitle={`of ${formatINR(metrics?.sales?.totalInvoiceValue || 0)} billed`}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="To collect"
          value={formatINR(metrics?.sales?.outstandingCustomerBalances || 0)}
          subtitle="Pending customer balances"
          icon={Clock}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent invoices */}
        <Card
          title="Recent invoices"
          className="lg:col-span-2 overflow-hidden"
          action={
            <Link to="/sales" className="text-sm text-red-700 hover:text-red-800 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2.5 px-5 font-medium">Invoice</th>
                  <th className="py-2.5 px-5 font-medium">Customer</th>
                  <th className="py-2.5 px-5 font-medium">Bike</th>
                  <th className="py-2.5 px-5 font-medium text-right">Total</th>
                  <th className="py-2.5 px-5 font-medium text-right">Balance</th>
                  <th className="py-2.5 px-5 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="py-3 px-5 font-medium text-slate-900 whitespace-nowrap">{inv.invoiceNumber}</td>
                      <td className="py-3 px-5">{inv.customer?.name}</td>
                      <td className="py-3 px-5 text-slate-600">
                        {inv.bikeModel?.modelName} {inv.bikeModel?.variant}
                      </td>
                      <td className="py-3 px-5 text-right tabular-nums">{formatINR(inv.totalAmount)}</td>
                      <td className="py-3 px-5 text-right tabular-nums text-slate-600">
                        {formatINR(inv.outstandingBalance)}
                      </td>
                      <td className="py-3 px-5">
                        {inv.saleStatus === 'cancelled' ? <Badge status="cancelled" /> : <Badge status={inv.paymentStatus} />}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      No invoices yet. Create the first sale.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low stock */}
        <Card
          title="Low stock"
          action={
            lowStockAlerts.length > 0 ? (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                {lowStockAlerts.length} models
              </span>
            ) : null
          }
        >
          {lowStockAlerts.length > 0 ? (
            <ul className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {lowStockAlerts.map((alert) => (
                <li key={alert.modelId} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="text-slate-800">
                    {alert.modelName} <span className="text-slate-500">{alert.variant}</span>
                  </span>
                  <span className="text-slate-600 tabular-nums whitespace-nowrap">
                    <span className={alert.available === 0 ? 'text-red-700 font-semibold' : 'font-semibold text-slate-900'}>
                      {alert.available}
                    </span>{' '}
                    left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-sm text-slate-400 text-center">All models are well stocked.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by month */}
        <Card title="Sales by month" className="lg:col-span-2">
          <div className="h-64 px-3 py-4">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrend} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="#efeff1" vertical={false} />
                  <XAxis dataKey="period" stroke="#9c9ea5" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#9c9ea5"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(val) => (val === 0 ? "₹0" : val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${Math.round(val / 1000)}k`)}
                  />
                  <Tooltip
                    cursor={{ fill: '#f7f7f8' }}
                    formatter={(val, name, item) => [`${formatINR(val)} · ${item.payload.sales} sales`, 'Billed']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: 13 }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {salesTrend.map((_, i) => (
                      <Cell key={i} fill={i === lastTrendIndex ? '#cc0000' : '#d1d2d6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No sales yet.</div>
            )}
          </div>
        </Card>

        {/* Top models */}
        <Card title="Best-selling models">
          {modelWiseSales.length > 0 ? (
            <ul className="px-5 py-3 space-y-3">
              {modelWiseSales.map((m) => {
                const max = modelWiseSales[0]?.unitsSold || 1;
                return (
                  <li key={m._id} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-800">{m.modelName}</span>
                      <span className="text-slate-600 tabular-nums">{m.unitsSold} sold</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(m.unitsSold / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-5 py-10 text-sm text-slate-400 text-center">No sales yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
};
