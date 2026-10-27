import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Calendar,
  User,
  Bike,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { formatDate } from '../utils/formatters';

export const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    bikeModel: '',
    status: 'new',
    source: 'Walk-in',
    notes: '',
    followUpDate: '',
  });

  const { showSuccess, showError } = useNotification();

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/enquiries', {
        params: { ...(statusFilter && { status: statusFilter }) },
      });
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      showError('Failed to fetch enquiries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [custRes, modelRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/bike-models'),
      ]);
      setCustomers(custRes.data.customers || []);
      setModels(modelRes.data.bikeModels || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchDropdownData();
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enquiries', formData);
      showSuccess('Enquiry logged successfully');
      setIsModalOpen(false);
      setFormData({
        customer: '',
        bikeModel: '',
        status: 'new',
        source: 'Walk-in',
        notes: '',
        followUpDate: '',
      });
      fetchEnquiries();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create enquiry');
    }
  };

  const handleStatusChange = async (enquiryId, newStatus) => {
    try {
      await api.put(`/enquiries/${enquiryId}`, { status: newStatus });
      showSuccess(`Status updated to ${newStatus}`);
      fetchEnquiries();
    } catch (err) {
      showError('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Enquiries</h1>
          <p className="text-sm text-slate-500 mt-1">Customers interested in a bike, and when to follow up.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Enquiry</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="test_ride_scheduled">Test Ride Scheduled</option>
            <option value="negotiating">Negotiating</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">{enquiries.length} Enquiries</span>
      </div>

      {/* Enquiries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading customer inquiries...
          </div>
        ) : enquiries.length > 0 ? (
          enquiries.map((enq) => (
            <div
              key={enq._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{enq.customer?.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{enq.customer?.phone}</p>
                  </div>
                  <Badge status={enq.status} />
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-red-600" />
                    {enq.bikeModel?.modelName}
                  </span>
                  <span className="text-[10px] text-slate-500">{enq.source}</span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                  {enq.notes || 'No specific notes recorded.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Follow-up: {formatDate(enq.followUpDate)}
                </span>

                <select
                  value={enq.status}
                  onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                  className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="test_ride_scheduled">Test Ride</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No inquiries found.
          </div>
        )}
      </div>

      {/* CREATE ENQUIRY MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Enquiry"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Registered Customer *
            </label>
            <select
              required
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Motorcycle Model of Interest *
              </label>
              <select
                required
                value={formData.bikeModel}
                onChange={(e) => setFormData({ ...formData, bikeModel: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="">Select Bike Model</option>
                {models.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.modelName} ({m.variant})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="Walk-in">Walk-in Showroom</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Website">Official Website</option>
                <option value="Referral">Customer Referral</option>
                <option value="Social Media">Social Media</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Planned Next Follow-Up Date
            </label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discussion Notes & Customer Requirements
            </label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Inquired about Activa 6G blue colour availability, asked for exchange valuation of old scooter."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            ></textarea>
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
              Save Enquiry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
