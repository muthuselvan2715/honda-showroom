import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bike,
  Users,
  MessageSquare,
  Compass,
  Receipt,
  PlusCircle,
  CreditCard,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Inventory', path: '/inventory', icon: Bike },
    { label: 'New Sale / Billing', path: '/sales/new', icon: PlusCircle },
    { label: 'Sales & Invoices', path: '/sales', icon: Receipt },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Enquiries & Leads', path: '/enquiries', icon: MessageSquare },
    { label: 'Test Rides', path: '/test-rides', icon: Compass },
    { label: 'Reports & Export', path: '/reports', icon: BarChart3 },
    ...(isAdmin
      ? [
          { label: 'Showroom Settings', path: '/settings', icon: Settings },
          { label: 'Audit Trail', path: '/audit-logs', icon: ShieldAlert },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Dealership Logo & Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="bg-red-600 text-white font-black text-sm px-2.5 py-1 rounded tracking-tighter">
            HONDA
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
              APEX MOTORS
            </span>
            <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider block">
              Dealership ERP
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-3 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Authorized Staff'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isAdmin
                ? 'bg-red-950 text-red-300 border border-red-800/80'
                : 'bg-blue-950 text-blue-300 border border-blue-800/80'
            }`}
          >
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
          <span>Honda Showroom Management</span>
          <span className="block text-[10px] text-slate-600 mt-0.5">v1.0 • Technical Portfolio</span>
        </div>
      </aside>
    </>
  );
};
