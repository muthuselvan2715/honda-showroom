import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatINR, formatINRDecimal, formatDate } from '../utils/formatters';

export const InvoicePrintModal = ({ isOpen, onClose, saleData }) => {
  if (!isOpen || !saleData) return null;

  const { sale, payments = [], amountInWords, showroom } = saleData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base tracking-wide">Tax Invoice Preview</span>
            <span className="text-xs bg-red-600 px-2.5 py-0.5 rounded-full font-semibold">
              {sale.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Sheet */}
        <div className="p-8 sm:p-10 text-slate-800 bg-white invoice-container text-xs sm:text-sm font-sans">
          {/* Header */}
          <div className="border-b-2 border-red-600 pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-red-600 text-white font-black text-lg px-2.5 py-1 rounded tracking-tighter">
                  HONDA
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {showroom?.showroomName || 'APEX HONDA MOTORS'}
                </h1>
              </div>
              <p className="text-xs text-red-700 font-semibold mt-1">
                {showroom?.tagline || 'Authorized Honda 2-Wheelers Sales & Service'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {showroom?.address}, {showroom?.city}, {showroom?.state} - {showroom?.pincode}
              </p>
              <p className="text-xs text-slate-600">
                Phone: {showroom?.phone} | Email: {showroom?.email}
              </p>
              <p className="text-xs font-mono font-semibold text-slate-800 mt-0.5">
                GSTIN: {showroom?.gstin || '29AABCH1234F1Z5'} | Dealer Code: {showroom?.dealerCode || 'HND-BLR-042'}
              </p>
            </div>
            <div className="text-right sm:border-l sm:pl-6 border-slate-200">
              <span className="inline-block uppercase tracking-wider text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-md mb-2">
                TAX INVOICE / SALE CERTIFICATE
              </span>
              <p className="text-xs text-slate-500">Invoice No:</p>
              <p className="text-base font-bold text-slate-900 font-mono">{sale.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Date:</p>
              <p className="text-xs font-semibold text-slate-800">{formatDate(sale.saleDate)}</p>
            </div>
          </div>

          {/* Customer & Vehicle Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Buyer Details */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                Customer (Buyer) Details
              </h3>
              <p className="font-bold text-slate-900 text-sm">{sale.customer?.name}</p>
              <p className="text-slate-600 mt-1">{sale.customer?.address}</p>
              <p className="text-slate-600">
                {sale.customer?.city}, {sale.customer?.state} {sale.customer?.pincode ? `- ${sale.customer.pincode}` : ''}
              </p>
              <p className="text-slate-700 font-medium mt-1">Phone: {sale.customer?.phone}</p>
              {sale.customer?.email && <p className="text-slate-600 text-xs">Email: {sale.customer.email}</p>}
              {sale.customer?.idProofNumber && (
                <p className="text-xs text-slate-500 mt-1">
                  ID: {sale.customer.idProofType} ({sale.customer.idProofNumber})
                </p>
              )}
            </div>

            {/* Vehicle Identification */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                Vehicle Specifications
              </h3>
              <p className="font-bold text-slate-900 text-sm">
                Honda {sale.bikeModel?.modelName} — {sale.bikeModel?.variant}
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-xs">
                <div>
                  <span className="text-slate-500">Chassis / VIN:</span>
                  <p className="font-mono font-bold text-slate-900">{sale.bikeUnit?.chassisNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Engine Number:</span>
                  <p className="font-mono font-bold text-slate-900">{sale.bikeUnit?.engineNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Color:</span>
                  <p className="font-medium text-slate-800">{sale.bikeUnit?.colour || 'Standard'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Year / Capacity:</span>
                  <p className="font-medium text-slate-800">
                    {sale.bikeModel?.modelYear} ({sale.bikeModel?.engineCapacityCc || 110}cc)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Financial Charges Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Description of Charges</th>
                  <th className="py-2.5 px-4 text-center">HSN/SAC</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2 px-4 font-mono">1</td>
                  <td className="py-2 px-4 font-medium text-slate-900">
                    Base Ex-Showroom Price (Honda {sale.bikeModel?.modelName})
                  </td>
                  <td className="py-2 px-4 text-center font-mono">8711</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold">
                    {formatINRDecimal(sale.exShowroomPrice)}
                  </td>
                </tr>

                {sale.accessoriesList?.map((acc, idx) => (
                  <tr key={idx} className="text-slate-600 bg-slate-50/30">
                    <td className="py-1.5 px-4 font-mono">{idx + 2}</td>
                    <td className="py-1.5 px-4">Accessory: {acc.name}</td>
                    <td className="py-1.5 px-4 text-center font-mono">8714</td>
                    <td className="py-1.5 px-4 text-right font-mono">{formatINRDecimal(acc.price)}</td>
                  </tr>
                ))}

                {sale.discountAmount > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/40">
                    <td className="py-2 px-4 font-mono">—</td>
                    <td className="py-2 px-4 font-medium">Special Dealership Discount</td>
                    <td className="py-2 px-4 text-center">—</td>
                    <td className="py-2 px-4 text-right font-mono font-semibold">
                      - {formatINRDecimal(sale.discountAmount)}
                    </td>
                  </tr>
                )}

                <tr className="font-semibold bg-slate-50/80">
                  <td colSpan="3" className="py-2 px-4 text-right text-slate-600">
                    Net Taxable Value
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-slate-900">
                    {formatINRDecimal(sale.taxableAmount)}
                  </td>
                </tr>

                <tr>
                  <td colSpan="3" className="py-2 px-4 text-right text-slate-600">
                    Central GST (CGST @ {(sale.gstRate || 28) / 2}%)
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{formatINRDecimal(sale.cgstAmount)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="py-2 px-4 text-right text-slate-600">
                    State GST (SGST @ {(sale.gstRate || 28) / 2}%)
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{formatINRDecimal(sale.sgstAmount)}</td>
                </tr>

                <tr>
                  <td colSpan="3" className="py-2 px-4 text-right text-slate-600">
                    Comprehensive 5-Year Insurance Coverage
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{formatINRDecimal(sale.insuranceCharge)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="py-2 px-4 text-right text-slate-600">
                    RTO Registration, Smart Card & Road Tax
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{formatINRDecimal(sale.rtoRegistrationCharge)}</td>
                </tr>

                {/* Grand Total */}
                <tr className="bg-red-50 border-t-2 border-red-600 font-bold text-red-900 text-sm">
                  <td colSpan="3" className="py-3 px-4 text-right uppercase tracking-wider">
                    Total On-Road Invoice Amount
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base font-extrabold text-red-700">
                    {formatINRDecimal(sale.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in words */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Amount In Words:
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 italic mt-0.5">
              {amountInWords || 'Rupees Zero Only'}
            </p>
          </div>

          {/* Payment Status Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-center">
              <span className="text-xs text-slate-500 font-medium">Total Billed</span>
              <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {formatINRDecimal(sale.totalAmount)}
              </p>
            </div>
            <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-xl text-center">
              <span className="text-xs text-emerald-700 font-medium">Amount Received</span>
              <p className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                {formatINRDecimal(sale.amountPaid)}
              </p>
            </div>
            <div
              className={`p-3 border rounded-xl text-center ${
                sale.outstandingBalance > 0
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <span className="text-xs font-medium">Balance Due</span>
              <p className="text-base font-bold font-mono mt-0.5">
                {formatINRDecimal(sale.outstandingBalance)}
              </p>
            </div>
          </div>

          {/* Terms and Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 mt-6 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700 mb-1">Terms & Conditions:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Registration of the vehicle is subject to RTO approval and document clearance.</li>
                <li>Manufacturer warranty as per Honda Motorcycle and Scooter India Pvt. Ltd. policy.</li>
                <li>Subject to jurisdiction of Bengaluru courts only.</li>
              </ol>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="w-48 border-b border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-800">For {showroom?.showroomName || 'APEX HONDA MOTORS'}</p>
              <p className="text-slate-500 text-[11px]">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
