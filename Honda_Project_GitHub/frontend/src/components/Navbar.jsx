import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

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
          onClick={logout}
          title="Sign out"
          className="ml-1 p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
