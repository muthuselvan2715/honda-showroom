import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Bike,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { formatDate } from '../utils/formatters';

export const TestRides = () => {
  const [testRides, setTestRides] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    bikeModel: '',
    scheduledDate: '',
    timeSlot: '10:00 AM - 11:00 AM',
    licenseNumber: '',
    remarks: '',
  });

  const { showSuccess, showError } = useNotification();

  const fetchTestRides = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/test-rides', {
        params: { ...(statusFilter && { status: statusFilter }) },
      });
      setTestRides(res.data.testRides || []);
    } catch (err) {
      showError('Failed to fetch test rides');
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
    fetchTestRides();
    fetchDropdownData();
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/test-rides', formData);
      showSuccess('Test ride slot confirmed successfully');
      setIsModalOpen(false);
      setFormData({
        customer: '',
        bikeModel: '',
        scheduledDate: '',
        timeSlot: '10:00 AM - 11:00 AM',
        licenseNumber: '',
        remarks: '',
      });
      fetchTestRides();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to book test ride');
    }
  };

  const handleStatusChange = async (rideId, status) => {
    try {
      await api.put(`/test-rides/${rideId}`, { status });
      showSuccess(`Test ride marked as ${status}`);
      fetchTestRides();
    } catch (err) {
      showError('Failed to update test ride status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Test Ride Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer trial ride schedule, driving license verification, and route logs
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book Test Ride</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">{testRides.length} Bookings</span>
      </div>

      {/* Test Rides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading test ride bookings...
          </div>
        ) : testRides.length > 0 ? (
          testRides.map((ride) => (
            <div
              key={ride._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{ride.customer?.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{ride.customer?.phone}</p>
                  </div>
                  <Badge status={ride.status} />
                </div>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-medium text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-red-600" />
                      {ride.bikeModel?.modelName}
                    </span>
                    <span className="font-mono text-slate-500">{ride.timeSlot}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Date: {formatDate(ride.scheduledDate)}</span>
                    <span className="font-mono">DL: {ride.licenseNumber}</span>
                  </div>
                </div>

                {ride.feedback && (
                  <p className="text-xs text-slate-600 mt-3 italic line-clamp-2">
                    "{ride.feedback}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Staff: {ride.handledBy?.name || 'Assigned'}
                </span>

                <div className="flex items-center gap-1">
                  {ride.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(ride._id, 'completed')}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange(ride._id, 'cancelled')}
                        className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {ride.status === 'completed' && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Done
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No test rides scheduled.
          </div>
        )}
      </div>

      {/* BOOK TEST RIDE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Motorcycle Test Ride"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Customer *
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Motorcycle Model *
            </label>
            <select
              required
              value={formData.bikeModel}
              onChange={(e) => setFormData({ ...formData, bikeModel: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Select Motorcycle Model</option>
              {models.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.modelName} ({m.variant})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Booking Date *
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Time Slot *
              </label>
              <select
                required
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                <option value="03:30 PM - 04:30 PM">03:30 PM - 04:30 PM</option>
                <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Driving License Number (Mandatory for RTO compliance) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KA-03-20210045678"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Special Requests or Route Preference
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Customer requested pillion comfort test with family member"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              Schedule Test Ride
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
