import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  XCircle,
  Eye,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Badge } from '../components/Badge';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatINR, formatDate } from '../utils/formatters';

export const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [saleStatus, setSaleStatus] = useState('');

  // Modals
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Cancel Modal
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sales', {
        params: {
          page,
          limit: 12,
          search,
          paymentStatus,
          status: saleStatus,
        },
      });
      setSales(res.data.sales || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      showError('Failed to load sales and invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, search, paymentStatus, saleStatus]);

  // Open Printable Invoice
  const handleOpenInvoice = async (saleId) => {
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSelectedInvoiceData(res.data);
      setIsPrintModalOpen(true);
    } catch (err) {
      showError('Failed to load printable invoice details.');
    }
  };

  // Confirm Cancellation
  const handleConfirmCancel = async () => {
    if (!saleToCancel) return;
    setIsCancelling(true);
    try {
      await api.post(`/sales/${saleToCancel._id}/cancel`, {
        reason: cancelReason || 'Customer requested order cancellation',
      });
      showSuccess(`Invoice ${saleToCancel.invoiceNumber} has been cancelled. Bike unit released.`);
      setSaleToCancel(null);
      setCancelReason('');
      fetchSales();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel invoice');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">All sales – print an invoice, check the balance, or cancel a sale.</p>
        </div>
        <Link
          to="/sales/new"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number (e.g. HND-2026)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="">All Payment Statuses</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="pending">Pending Payment</option>
          </select>

          <select
            value={saleStatus}
            onChange={(e) => {
              setSaleStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="">All Sales Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle Model</th>
                <th className="py-3 px-4 font-mono">VIN / Chassis</th>
                <th className="py-3 px-4 text-right">Total Invoice</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(sale.saleDate)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{sale.customer?.name}</span>
                      <span className="text-[11px] text-slate-400">{sale.customer?.phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{sale.bikeModel?.modelName}</span>
                      <span className="text-[11px] text-slate-400">{sale.bikeModel?.variant}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {sale.bikeUnit?.chassisNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(sale.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      {formatINR(sale.amountPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800 font-semibold">
                      {formatINR(sale.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <Badge status={sale.paymentStatus} />
                        {sale.saleStatus === 'cancelled' && (
                          <span className="text-[10px] font-bold text-rose-600 uppercase">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenInvoice(sale._id)}
                          title="Print / View Invoice"
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Printer className="w-4 h-4" />
                          <span className="hidden sm:inline">Print</span>
                        </button>
                        {isAdmin && sale.saleStatus === 'confirmed' && (
                          <button
                            onClick={() => setSaleToCancel(sale)}
                            title="Cancel Sale"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    No sales invoices match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {page} of {totalPages} ({total} invoices)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-800">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PRINT INVOICE MODAL */}
      <InvoicePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        saleData={selectedInvoiceData}
      />

      {/* CANCEL SALE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(saleToCancel)}
        onClose={() => {
          setSaleToCancel(null);
          setCancelReason('');
        }}
        onConfirm={handleConfirmCancel}
        title={`Cancel Invoice ${saleToCancel?.invoiceNumber}`}
        message={`Are you sure you want to cancel this sale? The allocated motorcycle unit (${saleToCancel?.bikeUnit?.chassisNumber || ''}) will be returned to 'available' stock in inventory.`}
        confirmText="Confirm Cancellation"
        isLoading={isCancelling}
      />
    </div>
  );
};
