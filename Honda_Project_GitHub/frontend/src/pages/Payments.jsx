import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Receipt,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { formatINR, formatINRDecimal, formatDate, formatDateTime } from '../utils/formatters';

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [openInvoices, setOpenInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [methodFilter, setMethodFilter] = useState('');

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentType, setPaymentType] = useState('partial');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/payments', {
        params: { paymentMethod: methodFilter, limit: 25 },
      });
      setPayments(res.data.payments || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      showError('Failed to load payment transaction history.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOpenInvoices = async () => {
    try {
      const res = await api.get('/sales', {
        params: { paymentStatus: 'partial', limit: 100 },
      });
      const pendingRes = await api.get('/sales', {
        params: { paymentStatus: 'pending', limit: 100 },
      });
      const allOpen = [...(res.data.sales || []), ...(pendingRes.data.sales || [])];
      setOpenInvoices(allOpen);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchOpenInvoices();
  }, [methodFilter]);

  const handleSelectSale = (saleId) => {
    setSelectedSaleId(saleId);
    const sale = openInvoices.find((s) => s._id === saleId);
    setSelectedSale(sale || null);
    if (sale) {
      setPaymentAmount(sale.outstandingBalance);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!selectedSaleId) {
      showError('Please select an open customer invoice.');
      return;
    }

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      showError('Payment amount must be greater than zero.');
      return;
    }

    if (selectedSale && amount > selectedSale.outstandingBalance) {
      showError(`Payment amount (₹${amount}) cannot exceed outstanding balance (₹${selectedSale.outstandingBalance}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/payments', {
        saleId: selectedSaleId,
        amount,
        paymentMethod,
        paymentType: amount === selectedSale?.outstandingBalance ? 'full_settlement' : 'partial',
        transactionReference: transactionRef,
        notes,
      });

      showSuccess(`Payment of ₹${amount} recorded successfully!`);
      setIsModalOpen(false);
      setSelectedSaleId('');
      setSelectedSale(null);
      setPaymentAmount('');
      setTransactionRef('');
      setNotes('');
      fetchPayments();
      fetchOpenInvoices();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to record payment transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Collections</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log partial installments, advance booking receipts, and invoice settlements
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filter by Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="">All Payment Methods</option>
            <option value="upi">UPI (GPay / PhonePe / QR)</option>
            <option value="cash">Cash</option>
            <option value="card">Card (Debit/Credit)</option>
            <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">{total} Total Transactions</span>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Invoice Reference</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Transaction UTR / Ref</th>
                <th className="py-3 px-4 text-right">Amount Collected</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(p.paymentDate)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.sale?.invoiceNumber || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{p.customer?.name}</span>
                      <span className="text-[11px] text-slate-400">{p.customer?.phone}</span>
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-slate-600">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 truncate max-w-[150px]">
                      {p.transactionReference || 'Counter Entry'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.receivedBy?.name || 'Cashier'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Success
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No payment collection transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment Receipt"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Outstanding Customer Invoice *
            </label>
            <select
              required
              value={selectedSaleId}
              onChange={(e) => handleSelectSale(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600 font-mono font-medium"
            >
              <option value="">Select an invoice with outstanding balance</option>
              {openInvoices.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.invoiceNumber} — {s.customer?.name} (Balance Due: ₹{s.outstandingBalance})
                </option>
              ))}
            </select>
          </div>

          {selectedSale && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 block">Total Billed</span>
                <span className="font-bold text-slate-900 font-mono">{formatINR(selectedSale.totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Previously Paid</span>
                <span className="font-bold text-emerald-700 font-mono">{formatINR(selectedSale.amountPaid)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Balance Remaining</span>
                <span className="font-extrabold text-red-700 font-mono text-sm">
                  {formatINR(selectedSale.outstandingBalance)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount Being Paid (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedSale?.outstandingBalance}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-red-600"
              />
              {selectedSale && (
                <button
                  type="button"
                  onClick={() => setPaymentAmount(selectedSale.outstandingBalance)}
                  className="text-[11px] text-red-600 hover:underline font-semibold mt-1 block"
                >
                  Pay Full Balance (₹{selectedSale.outstandingBalance})
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Channel *
              </label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                <option value="cash">Cash Payment at Counter</option>
                <option value="card">Debit / Credit Card Swipe</option>
                <option value="bank_transfer">NEFT / RTGS Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transaction Reference / UTR / Cheque Number
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-9824018274 or POS-SLIP-491"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Second installment paid prior to delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSaleId}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
