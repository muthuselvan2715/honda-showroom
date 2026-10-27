import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Eye,
  Edit2,
  Calendar,
  Receipt,
  Bike,
  Compass,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { formatINR, formatDate } from '../utils/formatters';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { showSuccess, showError } = useNotification();

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
    notes: '',
  });

  // View Customer Details Drawer / Modal
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search: searchQuery, page, limit: 12 },
      });
      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, formData);
        showSuccess('Customer details updated successfully');
      } else {
        await api.post('/customers', formData);
        showSuccess('New customer registered successfully');
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleViewCustomer = async (cust) => {
    try {
      const res = await api.get(`/customers/${cust._id}`);
      setSelectedCustomerData(res.data);
      setIsViewModalOpen(true);
    } catch (err) {
      showError('Failed to load complete customer history');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Contact details and purchase history of every customer.</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              address: '',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '',
              idProofType: 'Aadhaar',
              idProofNumber: '',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
          />
        </div>
        <span className="text-xs font-medium text-slate-500 hidden sm:inline">
          Total Customers: {total}
        </span>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading customer database...
          </div>
        ) : customers.length > 0 ? (
          customers.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {c.idProofType}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {c.email && (
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {c.address}, {c.city}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Added: {formatDate(c.createdAt)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleViewCustomer(c)}
                    className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>History</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingCustomer(c);
                      setFormData({
                        name: c.name,
                        phone: c.phone,
                        email: c.email || '',
                        address: c.address,
                        city: c.city || 'Bengaluru',
                        state: c.state || 'Karnataka',
                        pincode: c.pincode || '',
                        idProofType: c.idProofType || 'Aadhaar',
                        idProofNumber: c.idProofNumber || '',
                        notes: c.notes || '',
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No customers found matching your search.
          </div>
        )}
      </div>

      {/* MODAL: REGISTER / EDIT CUSTOMER */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Update Customer Profile' : 'Add Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ID Proof Type
              </label>
              <select
                value={formData.idProofType}
                onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ID Proof Number
              </label>
              <input
                type="text"
                placeholder="e.g. 1234-5678-9012"
                value={formData.idProofNumber}
                onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pincode
              </label>
              <input
                type="text"
                placeholder="e.g. 560038"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Residential Address *
            </label>
            <input
              type="text"
              required
              placeholder="Flat / House No, Street, Locality"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CUSTOMER COMPLETE PURCHASE & ENQUIRY HISTORY */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Customer: ${selectedCustomerData?.customer?.name || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedCustomerData && (
          <div className="space-y-6">
            {/* Contact details card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedCustomerData.customer.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {selectedCustomerData.customer.email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">City</span>
                  <span className="font-semibold text-slate-800">{selectedCustomerData.customer.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ID Proof</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCustomerData.customer.idProofType} ({selectedCustomerData.customer.idProofNumber || 'Verified'})
                  </span>
                </div>
              </div>
            </div>

            {/* Invoices & Purchase History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-red-600" />
                <span>Vehicle Invoices ({selectedCustomerData.sales?.length || 0})</span>
              </h4>
              {selectedCustomerData.sales?.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5">Invoice</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">VIN / Chassis</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedCustomerData.sales.map((s) => (
                        <tr key={s._id}>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                          <td className="p-2.5">{formatDate(s.saleDate)}</td>
                          <td className="p-2.5">{s.bikeModel?.modelName}</td>
                          <td className="p-2.5 font-mono">{s.bikeUnit?.chassisNumber || '—'}</td>
                          <td className="p-2.5 text-right font-mono font-semibold">{formatINR(s.totalAmount)}</td>
                          <td className="p-2.5 text-center">
                            <Badge status={s.paymentStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No purchase history recorded yet.</p>
              )}
            </div>

            {/* Enquiries */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-blue-600" />
                <span>Enquiries & Leads ({selectedCustomerData.enquiries?.length || 0})</span>
              </h4>
              {selectedCustomerData.enquiries?.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomerData.enquiries.map((enq) => (
                    <div key={enq._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{enq.bikeModel?.modelName}</span>
                        <p className="text-slate-500 mt-0.5">{enq.notes || 'Interested in pricing'}</p>
                      </div>
                      <Badge status={enq.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No logged inquiries.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
