import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Building2,
  Users,
  ShieldCheck,
  Plus,
  Lock,
  UserCheck,
  UserX,
  KeyRound,
  Trash2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/Modal';

export const Settings = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [settings, setSettings] = useState({
    showroomName: '',
    tagline: '',
    dealerCode: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    invoicePrefix: 'HND-2026',
    defaultGstRate: 28,
    defaultInsuranceRate: 5500,
    defaultRtoCharge: 8500,
    defaultReorderThreshold: 3,
  });

  const [usersList, setUsersList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
  });

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [clearForm, setClearForm] = useState({ confirmText: '', password: '', keepModels: true });
  const [isClearing, setIsClearing] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/auth/users/${resetTarget._id}/reset-password`, { newPassword: resetPassword });
      showSuccess(res.data.message);
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      showError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleClearData = async (e) => {
    e.preventDefault();
    setIsClearing(true);
    try {
      const res = await api.post('/settings/clear-data', clearForm);
      showSuccess(res.data.message);
      setIsClearOpen(false);
      setClearForm({ confirmText: '', password: '', keepModels: true });
      fetchSettings();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      showError('Failed to load dealership configuration');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsersList(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings', settings);
      showSuccess('Showroom configuration updated successfully');
    } catch (err) {
      showError('Failed to update showroom settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', newUser);
      showSuccess(`Created user: ${newUser.email}`);
      setIsUserModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'staff', phone: '' });
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (targetUserId) => {
    try {
      const res = await api.patch(`/auth/users/${targetUserId}/toggle-status`);
      showSuccess(res.data.message);
      fetchUsers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Showroom details, tax defaults and staff logins.</p>
      </div>

      {/* Showroom Configuration Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold text-slate-900">Showroom details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Showroom name *
            </label>
            <input
              type="text"
              required
              value={settings.showroomName}
              onChange={(e) => setSettings({ ...settings, showroomName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tagline / Subheading
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Honda Dealer Code
            </label>
            <input
              type="text"
              value={settings.dealerCode}
              onChange={(e) => setSettings({ ...settings, dealerCode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              GSTIN *
            </label>
            <input
              type="text"
              required
              value={settings.gstin}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Invoice Prefix
            </label>
            <input
              type="text"
              value={settings.invoicePrefix}
              onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Showroom Physical Address
          </label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default GST %
            </label>
            <input
              type="number"
              value={settings.defaultGstRate}
              onChange={(e) => setSettings({ ...settings, defaultGstRate: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default Insurance (₹)
            </label>
            <input
              type="number"
              value={settings.defaultInsuranceRate}
              onChange={(e) => setSettings({ ...settings, defaultInsuranceRate: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default RTO (₹)
            </label>
            <input
              type="number"
              value={settings.defaultRtoCharge}
              onChange={(e) => setSettings({ ...settings, defaultRtoCharge: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reorder Alert Threshold
            </label>
            <input
              type="number"
              value={settings.defaultReorderThreshold}
              onChange={(e) => setSettings({ ...settings, defaultReorderThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving…' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Staff & User Management (Admin Only) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-slate-900">Staff logins</h2>
          </div>
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usersList.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        u.role === 'admin'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setResetTarget(u);
                        setResetPassword('');
                      }}
                      title="Set a new password"
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 mr-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Reset Password
                    </button>
                    {u._id !== user?.id && (
                      <button
                        onClick={() => handleToggleUserStatus(u._id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                          u.isActive
                            ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                            : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Go-live: clear demo data */}
      <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Start fresh (clear demo data)</h2>
            <p className="text-sm text-slate-500 mt-1">
              Before real billing starts, remove all sample customers, bills, payments, enquiries and stock.
              Staff logins and showroom details are kept. Invoice numbers restart from 1001.
            </p>
          </div>
          <button
            onClick={() => setIsClearOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-rose-300 text-rose-700 text-sm font-semibold hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear Demo Data
          </button>
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password - ${resetTarget?.name || ''}`} maxWidth="max-w-md">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-slate-600">
            Set a new password for <b>{resetTarget?.email}</b> and tell it to them. They can change it later from the key icon at the top.
          </p>
          <input
            type="text"
            required
            minLength={6}
            placeholder="New password (min 6 characters)"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setResetTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700">
              Save New Password
            </button>
          </div>
        </form>
      </Modal>

      {/* CLEAR DATA MODAL */}
      <Modal isOpen={isClearOpen} onClose={() => setIsClearOpen(false)} title="Clear Demo Data" maxWidth="max-w-md">
        <form onSubmit={handleClearData} className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
            This permanently deletes every customer, bill, payment, enquiry, test ride and bike in stock. It cannot be undone.
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={clearForm.keepModels}
              onChange={(e) => setClearForm({ ...clearForm, keepModels: e.target.checked })}
            />
            Keep the bike models and price list
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Type <b>DELETE ALL DATA</b> to confirm
            </span>
            <input
              type="text"
              required
              value={clearForm.confirmText}
              onChange={(e) => setClearForm({ ...clearForm, confirmText: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Your password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={clearForm.password}
              onChange={(e) => setClearForm({ ...clearForm, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsClearOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isClearing || clearForm.confirmText !== 'DELETE ALL DATA'}
              className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:opacity-50"
            >
              {isClearing ? 'Clearing...' : 'Delete Everything'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE STAFF MODAL */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Add Staff Login"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Varma"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="staff@honda-dealership.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Role & Permissions *
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-red-600"
              >
                <option value="staff">Staff (Sales, Invoicing, Inventory View)</option>
                <option value="admin">Admin (Full Control, Settings, User Management)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98450 xxxxx"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
