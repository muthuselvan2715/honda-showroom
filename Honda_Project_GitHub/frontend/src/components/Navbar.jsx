import React from 'react';
import { Menu, LogOut, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs text-slate-500 font-medium">Dealer Network</span>
          <h2 className="text-sm font-bold text-slate-900">Bengaluru Mahadevapura Hub</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>MongoDB Atlas Ready</span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="hidden md:block text-right">
            <span className="text-xs font-bold text-slate-800 block leading-tight">{user?.name}</span>
            <span className="text-[11px] text-slate-500 capitalize">{user?.role} Access</span>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all border border-slate-200 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
