import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { formatINRDecimal, formatDateTime } from '../utils/formatters';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', r ? twoDigits(r) : ''].filter(Boolean).join(' ');
};

// Indian numbering: crore, lakh, thousand
export const rupeesInWords = (amount) => {
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  let n = Math.floor(value);
  const paise = Math.round((value - n) * 100);
  if (n === 0 && paise === 0) return 'Rupees Zero Only';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return `Rupees ${parts.join(' ') || 'Zero'}${paise ? ` and ${twoDigits(paise)} Paise` : ''} Only`;
};

const METHOD_LABEL = { cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank Transfer', cheque: 'Cheque' };

export const PaymentReceiptModal = ({ payment, sale, showroom, onClose }) => {
  if (!payment) return null;

  const joinParts = (parts, sep = ', ') => parts.filter((p) => p && String(p).trim() !== '').join(sep);
  const receiptNo = `RCPT-${String(payment._id).slice(-6).toUpperCase()}`;
  const isRefunded = payment.status === 'refunded';

  const handlePrint = () => {
    const previousTitle = document.title;
    document.title = `Receipt ${receiptNo}`;
    window.print();
    document.title = previousTitle;
  };

  const row = (label, value, mono = false) => (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );

  return createPortal(
    <div className="invoice-print-root fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 flex items-start sm:items-center justify-center p-2 sm:p-4">
      <div className="invoice-print-sheet bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
        <div className="no-print flex items-center justify-between px-5 py-3 bg-slate-900 text-white">
          <span className="font-semibold">Payment Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="invoice-container p-6 sm:p-8 text-sm">
          <div className="text-center border-b-2 border-red-600 pb-4 mb-4">
            <h2 className="text-xl font-bold text-red-700">{showroom?.showroomName || 'Honda Showroom'}</h2>
            <p className="text-xs text-slate-600 mt-1">
              {joinParts([showroom?.address, showroom?.city, showroom?.state])}
              {showroom?.pincode ? ` - ${showroom.pincode}` : ''}
            </p>
            <p className="text-xs text-slate-600">
              {joinParts([showroom?.phone && `Phone: ${showroom.phone}`, showroom?.gstin && `GSTIN: ${showroom.gstin}`], ' | ')}
            </p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold tracking-wide text-slate-900 uppercase">
              {isRefunded ? 'Payment Receipt (Refunded)' : 'Payment Receipt'}
            </h3>
            <div className="text-right text-xs">
              <p className="font-mono font-bold text-slate-900">{receiptNo}</p>
              <p className="text-slate-500">{formatDateTime(payment.paymentDate)}</p>
            </div>
          </div>

          <p className="text-slate-700 mb-4">
            Received with thanks from <b>{payment.customer?.name || sale?.customer?.name}</b>
            {payment.customer?.phone ? ` (${payment.customer.phone})` : ''} the sum of:
          </p>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center mb-4">
            <p className="text-2xl font-bold text-emerald-800 font-mono">{formatINRDecimal(payment.amount)}</p>
            <p className="text-xs italic text-emerald-900 mt-1">{rupeesInWords(payment.amount)}</p>
          </div>

          <div className="text-xs">
            {row('Against invoice', payment.sale?.invoiceNumber || sale?.invoiceNumber || '—', true)}
            {sale?.bikeModel && row('Vehicle', `Honda ${sale.bikeModel.modelName} ${sale.bikeModel.variant || ''}`)}
            {row('Payment mode', METHOD_LABEL[payment.paymentMethod] || payment.paymentMethod)}
            {payment.transactionReference && row('Reference / UTR', payment.transactionReference, true)}
            {sale && row('Invoice total', formatINRDecimal(sale.totalAmount), true)}
            {sale && row('Total paid so far', formatINRDecimal(sale.amountPaid), true)}
            {sale && row('Balance due', formatINRDecimal(sale.outstandingBalance), true)}
            {row('Received by', payment.receivedBy?.name || '—')}
          </div>

          <div className="flex justify-between items-end mt-10 text-xs text-slate-500">
            <p>This is a computer generated receipt.</p>
            <div className="text-right">
              <div className="w-40 border-b border-slate-400 mb-1 ml-auto"></div>
              <p className="font-semibold text-slate-800">For {showroom?.showroomName || 'Honda Showroom'}</p>
              <p>Cashier / Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
