import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Bike,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { formatINR, formatINRDecimal } from '../utils/formatters';

export const SalesBilling = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Reference data
  const [customers, setCustomers] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [showroomSettings, setShowroomSettings] = useState(null);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Choice: 'existing' | 'new'
  const [customerMode, setCustomerMode] = useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
  });

  // Selected Unit
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Financial Breakdown Form State
  const [insuranceCharge, setInsuranceCharge] = useState(5500);
  const [rtoCharge, setRtoCharge] = useState(8500);
  const [discountAmount, setDiscountAmount] = useState(0);
  // Start with no accessories – staff add only what the customer actually buys
  const [accessoriesList, setAccessoriesList] = useState([]);
  const [newAccessoryName, setNewAccessoryName] = useState('');
  const [newAccessoryPrice, setNewAccessoryPrice] = useState('');

  // Payment at booking
  const [advancePayment, setAdvancePayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [financeProvider, setFinanceProvider] = useState('');

  // Load Reference Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingRefs(true);
      try {
        const [custRes, unitRes, setRes] = await Promise.all([
          api.get('/customers', { params: { limit: 100 } }),
          api.get('/bike-units', { params: { status: 'available', limit: 100 } }),
          api.get('/settings'),
        ]);

        setCustomers(custRes.data.customers || []);
        setAvailableUnits(unitRes.data.units || []);
        if (setRes.data.settings) {
          setShowroomSettings(setRes.data.settings);
          const st = setRes.data.settings;
          setInsuranceCharge(st.defaultInsuranceRate ?? 5500);
          setRtoCharge(st.defaultRtoCharge ?? 8500);
          // Quick-register customers default to the showroom's own city and state
          setNewCustomerData((prev) => ({
            ...prev,
            city: st.city || prev.city,
            state: st.state || prev.state,
          }));
        }
      } catch (err) {
        showError('Failed to load initial billing form data.');
      } finally {
        setIsLoadingRefs(false);
      }
    };

    loadData();
  }, []);

  // Handle Unit Selection
  const handleUnitChange = (unitId) => {
    setSelectedUnitId(unitId);
    const unit = availableUnits.find((u) => u._id === unitId);
    setSelectedUnit(unit || null);
  };

  // Add accessory item
  const handleAddAccessory = () => {
    if (!newAccessoryName || !newAccessoryPrice) return;
    setAccessoriesList([
      ...accessoriesList,
      { name: newAccessoryName.trim(), price: Math.max(0, Number(newAccessoryPrice)) },
    ]);
    setNewAccessoryName('');
    setNewAccessoryPrice('');
  };

  // Remove accessory item
  const handleRemoveAccessory = (index) => {
    setAccessoriesList(accessoriesList.filter((_, idx) => idx !== index));
  };

  // Real-time calculation matching backend formula
  const basePrice = selectedUnit?.model?.basePrice || 0;
  const accessoriesTotal = accessoriesList.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const grossGoods = basePrice + accessoriesTotal;
  const effectiveDiscount = Math.min(Number(discountAmount) || 0, grossGoods);
  const taxableAmount = Math.max(0, grossGoods - effectiveDiscount);
  const gstRate = showroomSettings?.defaultGstRate || 28;
  const totalTaxAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
  const cgstAmount = Math.round((totalTaxAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((totalTaxAmount - cgstAmount) * 100) / 100;
  const totalInvoiceAmount = Math.round(
    (taxableAmount + totalTaxAmount + (Number(insuranceCharge) || 0) + (Number(rtoCharge) || 0)) * 100
  ) / 100;

  const effectiveAdvance = Math.max(0, Number(advancePayment) || 0);
  const outstandingBalance = Math.max(0, Math.round((totalInvoiceAmount - effectiveAdvance) * 100) / 100);

  // Form Submit
  const handleSubmitSale = async (e) => {
    e.preventDefault();

    if (!selectedUnitId) {
      showError('Please select an available motorcycle unit from inventory.');
      return;
    }

    if (customerMode === 'existing' && !selectedCustomerId) {
      showError('Please select a customer from the database.');
      return;
    }

    if (customerMode === 'new' && (!newCustomerData.name || !newCustomerData.phone)) {
      showError('Please provide at least a customer name and mobile phone number.');
      return;
    }

    if (effectiveAdvance > totalInvoiceAmount) {
      showError(`Advance payment (₹${effectiveAdvance}) cannot exceed total invoice (₹${totalInvoiceAmount}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...(customerMode === 'existing' ? { customerId: selectedCustomerId } : { newCustomer: newCustomerData }),
        bikeUnitId: selectedUnitId,
        insuranceCharge: Number(insuranceCharge),
        rtoRegistrationCharge: Number(rtoCharge),
        accessoriesList,
        discountAmount: Number(discountAmount),
        advancePayment: effectiveAdvance,
        paymentMethod,
        paymentReference,
        financeProvider,
        notes,
      };

      const res = await api.post('/sales', payload);
      showSuccess(`Invoice ${res.data.sale.invoiceNumber} created successfully! Bike unit marked as SOLD.`);
      navigate(`/sales?open=${res.data.sale._id}`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to complete sale transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Sale</h1>
        <p className="text-sm text-slate-500 mt-1">Choose the customer and the bike. Tax and total are worked out for you.</p>
      </div>

      <form onSubmit={handleSubmitSale} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: CUSTOMER, BIKE, ACCESSORIES */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Customer Selection */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-slate-900">1. Customer</h3>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      customerMode === 'existing' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Existing customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      customerMode === 'new' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    New customer
                  </button>
                </div>
              </div>

              {customerMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer *
                  </label>
                  <select
                    required={customerMode === 'existing'}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600 font-medium"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} — {c.phone} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required={customerMode === 'new'}
                        placeholder="e.g. Arun Kumar"
                        value={newCustomerData.name}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                      <input
                        type="tel"
                        required={customerMode === 'new'}
                        placeholder="10-digit number"
                        value={newCustomerData.phone}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="Residential address for RTO registration"
                      value={newCustomerData.address}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Available Motorcycle Unit Selection */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Bike className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-slate-900">2. Bike</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Bike in stock (chassis number) *
                </label>
                <select
                  required
                  value={selectedUnitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600 font-mono font-medium"
                >
                  <option value="">Select a bike</option>
                  {availableUnits.map((u) => (
                    <option key={u._id} value={u._id}>
                      VIN: {u.chassisNumber} • {u.model?.modelName} ({u.variant}) • {u.colour} • Base: ₹{u.model?.basePrice}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUnit && (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Model</span>
                    <span className="font-bold text-slate-900">{selectedUnit.model?.modelName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Variant & Year</span>
                    <span className="font-semibold text-slate-800">
                      {selectedUnit.variant} • {selectedUnit.model?.modelYear}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Colour</span>
                    <span className="font-semibold text-slate-800">{selectedUnit.colour}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ex-Showroom Price</span>
                    <span className="font-bold text-red-700 font-mono">
                      {formatINR(selectedUnit.model?.basePrice)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Dealership Accessories & Charges */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">3. Accessories & charges</h3>
                <span className="text-xs font-mono font-semibold text-slate-600">
                  Total: {formatINR(accessoriesTotal)}
                </span>
              </div>

              {/* Add accessory inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Accessory Name (e.g. Helmet, Tank Pad)"
                  value={newAccessoryName}
                  onChange={(e) => setNewAccessoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newAccessoryPrice}
                  onChange={(e) => setNewAccessoryPrice(e.target.value)}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={handleAddAccessory}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Accessory Items List */}
              <div className="space-y-1.5">
                {accessoriesList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-slate-900">{formatINR(item.price)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccessory(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount, Insurance & RTO Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    5-Yr Insurance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={insuranceCharge}
                    onChange={(e) => setInsuranceCharge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RTO Registration (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rtoCharge}
                    onChange={(e) => setRtoCharge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: TAX COMPUTATION & PAYMENT ADVANCE */}
          <div className="space-y-6">
            {/* Real-Time Tax Computation Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Bill summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Ex-Showroom:</span>
                  <span className="font-mono">{formatINRDecimal(basePrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Accessories Total:</span>
                  <span className="font-mono">{formatINRDecimal(accessoriesTotal)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Applied:</span>
                    <span className="font-mono">- {formatINRDecimal(effectiveDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-semibold pt-1 border-t border-slate-100">
                  <span>Taxable Goods Value:</span>
                  <span className="font-mono">{formatINRDecimal(taxableAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-500 pl-2">
                  <span>CGST @ {gstRate / 2}%:</span>
                  <span className="font-mono">{formatINRDecimal(cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-2">
                  <span>SGST @ {gstRate / 2}%:</span>
                  <span className="font-mono">{formatINRDecimal(sgstAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                  <span>Insurance Charge:</span>
                  <span className="font-mono">{formatINRDecimal(insuranceCharge)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>RTO & Road Tax:</span>
                  <span className="font-mono">{formatINRDecimal(rtoCharge)}</span>
                </div>

                {/* Grand Total */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-red-900 uppercase tracking-wider">
                      On-Road Total:
                    </span>
                    <span className="text-xl font-extrabold text-red-700 font-mono">
                      {formatINRDecimal(totalInvoiceAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Advance Payment Entry */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Payment now
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Advance / Full Payment (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalInvoiceAmount}
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-red-600"
                  />
                  <div className="flex justify-between text-[11px] mt-1 text-slate-500">
                    <button
                      type="button"
                      onClick={() => setAdvancePayment(totalInvoiceAmount)}
                      className="text-red-600 hover:underline font-semibold"
                    >
                      Pay full amount (₹{totalInvoiceAmount})
                    </button>
                    <span>Remaining: {formatINR(outstandingBalance)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
                  >
                    <option value="upi">UPI (GPay / PhonePe / QR)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="bank_transfer">NEFT / RTGS Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Reference / UTR number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/20261025/12345"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bike loan from (if financed)
                  </label>
                  <input
                    type="text"
                    list="finance-providers"
                    placeholder="Leave empty for cash purchase"
                    value={financeProvider}
                    onChange={(e) => setFinanceProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
                  />
                  <datalist id="finance-providers">
                    <option value="Honda Finance (HFCI)" />
                    <option value="Shriram Finance" />
                    <option value="IDFC First Bank" />
                    <option value="Indian Bank" />
                    <option value="Bajaj Finance" />
                    <option value="HDFC Bank" />
                  </datalist>
                  <p className="text-[11px] text-slate-400 mt-1">Printed on the invoice as hypothecation for RTO.</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedUnitId}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Confirm Sale & Create Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
