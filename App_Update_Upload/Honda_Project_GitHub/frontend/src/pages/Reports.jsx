import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Wallet,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { formatINR, formatDate } from '../utils/formatters';

export const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales'); // 'sales' | 'inventory' | 'outstanding'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { showError, showSuccess } = useNotification();

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      let endpoint = '/reports/sales';
      let params = {};

      if (activeReport === 'sales') {
        endpoint = '/reports/sales';
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (activeReport === 'inventory') {
        endpoint = '/reports/inventory';
      } else if (activeReport === 'outstanding') {
        endpoint = '/reports/outstanding-balances';
      }

      const res = await api.get(endpoint, { params });
      setReportData(res.data);
    } catch (err) {
      showError('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate]);

  const handleExportCSV = async () => {
    try {
      let endpoint = `/reports/${activeReport === 'outstanding' ? 'outstanding-balances' : activeReport}?format=csv`;
      if (startDate) endpoint += `&startDate=${startDate}`;
      if (endDate) endpoint += `&endDate=${endDate}`;

      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess(`Exported ${activeReport} report to CSV successfully`);
    } catch (err) {
      showError('Failed to export CSV report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Sales, stock and pending dues. Download any report as CSV.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium transition-all self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveReport('sales')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeReport === 'sales'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Sales</span>
        </button>
        <button
          onClick={() => setActiveReport('inventory')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeReport === 'inventory'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Stock</span>
        </button>
        <button
          onClick={() => setActiveReport('outstanding')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeReport === 'outstanding'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Pending Dues</span>
        </button>
      </div>

      {/* Date Filter for Sales Report */}
      {activeReport === 'sales' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Dates:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-red-600"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-red-600"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-red-600 font-semibold hover:underline ml-2"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {activeReport === 'sales' && reportData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Billed Revenue"
            value={formatINR(reportData.summary.totalRevenue)}
            icon={Receipt}
            color="red"
          />
          <StatCard
            title="Total Collected"
            value={formatINR(reportData.summary.totalCollected)}
            icon={Download}
            color="emerald"
          />
          <StatCard
            title="Total Outstanding"
            value={formatINR(reportData.summary.totalOutstanding)}
            icon={Wallet}
            color="amber"
          />
        </div>
      )}

      {activeReport === 'inventory' && reportData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Stock Units"
            value={reportData.summary.totalUnits}
            color="blue"
          />
          <StatCard
            title="Available Floor Units"
            value={reportData.summary.available}
            color="emerald"
          />
          <StatCard
            title="Reserved Units"
            value={reportData.summary.reserved}
            color="amber"
          />
          <StatCard
            title="Sold Handover Units"
            value={reportData.summary.sold}
            color="slate"
          />
        </div>
      )}

      {activeReport === 'outstanding' && reportData && (
        <div className="max-w-xs">
          <StatCard
            title="Total Receivables Balance"
            value={formatINR(reportData.totalOutstanding || 0)}
            subtitle={`${reportData.count || 0} Open Invoices`}
            icon={Wallet}
            color="red"
          />
        </div>
      )}

      {/* REPORT DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeReport === 'sales' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Model & Variant</th>
                  <th className="py-3 px-4 font-mono">VIN / Chassis</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Total Invoice</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="py-10 text-center text-slate-400">Loading sales report...</td>
                  </tr>
                ) : reportData?.sales?.length > 0 ? (
                  reportData.sales.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(s.saleDate)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.customer?.name}</td>
                      <td className="py-3 px-4">{s.bikeModel?.modelName} ({s.bikeModel?.variant})</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{s.bikeUnit?.chassisNumber || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatINR(s.taxableAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatINR(s.totalTaxAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(s.totalAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatINR(s.amountPaid)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800 font-semibold">{formatINR(s.outstandingBalance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-10 text-center text-slate-400">No records found for the selected period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeReport === 'inventory' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Chassis / VIN</th>
                  <th className="py-3 px-4">Engine Number</th>
                  <th className="py-3 px-4">Model & Variant</th>
                  <th className="py-3 px-4">Colour</th>
                  <th className="py-3 px-4 text-right">Dealer Purchase Cost</th>
                  <th className="py-3 px-4 text-right">Base Ex-Showroom</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400">Loading inventory status...</td>
                  </tr>
                ) : reportData?.units?.length > 0 ? (
                  reportData.units.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.chassisNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{u.engineNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{u.model?.modelName} ({u.variant})</td>
                      <td className="py-3 px-4">{u.colour}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">{formatINR(u.purchaseCost)}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatINR(u.model?.basePrice)}</td>
                      <td className="py-3 px-4"><Badge status={u.status} /></td>
                      <td className="py-3 px-4 text-slate-600">{u.location}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400">No inventory units found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeReport === 'outstanding' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400">Loading receivables...</td>
                  </tr>
                ) : reportData?.sales?.length > 0 ? (
                  reportData.sales.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.customer?.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.customer?.phone}</td>
                      <td className="py-3 px-4">{s.bikeModel?.modelName}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatINR(s.totalAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatINR(s.amountPaid)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-red-600">{formatINR(s.outstandingBalance)}</td>
                      <td className="py-3 px-4 text-center"><Badge status={s.paymentStatus} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400">All customer invoices are fully settled.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
