import React, { useState } from 'react';
import { Menu, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Modal } from './Modal';
import api from '../services/api';

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setForm(emptyForm);
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) return showError('New password must be at least 6 characters.');
    if (form.newPassword !== form.confirmPassword) return showError('New password and confirm password do not match.');
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      showSuccess('Password changed. Use the new password next time you sign in.');
      close();
    } catch (err) {
      showError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, autoComplete) => (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      <input
        type="password"
        required
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={close} title="Change Password" maxWidth="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        {field('currentPassword', 'Current password', 'current-password')}
        {field('newPassword', 'New password (min 6 characters)', 'new-password')}
        {field('confirmPassword', 'Confirm new password', 'new-password')}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={close} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const initials = (user?.name || 'U')
    .replace(/\(.*\)/, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm text-slate-500">{today}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-800 leading-tight">
            {(user?.name || '').replace(/\s*\(.*\)/, '')}
          </p>
          <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
        <button
          onClick={() => setShowPassword(true)}
          title="Change password"
          className="ml-1 p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <KeyRound className="w-4 h-4" />
        </button>
        <button
          onClick={logout}
          title="Sign out"
          className="ml-1 p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      <ChangePasswordModal isOpen={showPassword} onClose={() => setShowPassword(false)} />
    </header>
  );
};
