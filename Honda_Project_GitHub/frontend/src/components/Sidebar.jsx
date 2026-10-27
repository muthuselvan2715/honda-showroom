import React, { useEffect, useState } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const [showroomName, setShowroomName] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/settings')
      .then((res) => {
        if (active) setShowroomName(res.data?.settings?.showroomName || '');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const groups = [
    {
      title: null,
      items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }],
    },
    {
      title: 'Sales',
      items: [
        { label: 'New Sale', path: '/sales/new', icon: PlusCircle },
        { label: 'Invoices', path: '/sales', icon: Receipt },
        { label: 'Payments', path: '/payments', icon: CreditCard },
      ],
    },
    {
      title: 'Customers',
      items: [
        { label: 'Customers', path: '/customers', icon: Users },
        { label: 'Enquiries', path: '/enquiries', icon: MessageSquare },
        { label: 'Test Rides', path: '/test-rides', icon: Compass },
      ],
    },
    {
      title: 'Stock & Reports',
      items: [
        { label: 'Inventory', path: '/inventory', icon: Bike },
        { label: 'Reports', path: '/reports', icon: BarChart3 },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'Admin',
            items: [
              { label: 'Settings', path: '/settings', icon: Settings },
              { label: 'Activity Log', path: '/audit-logs', icon: ShieldCheck },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-60 bg-white flex flex-col border-r border-slate-200 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
          <div className="bg-red-600 text-white font-bold text-xs px-2 py-1 rounded-md tracking-wide">HONDA</div>
          <span className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2" title={showroomName}>
            {showroomName || 'Showroom'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <p className="px-3 mb-1.5 text-xs font-medium text-slate-400">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/' || item.path === '/sales'}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-red-50 text-red-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
