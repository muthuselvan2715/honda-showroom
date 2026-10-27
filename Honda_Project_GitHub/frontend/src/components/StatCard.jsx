import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'red', trend }) => {
  const iconColor = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
    slate: 'text-slate-500',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        {Icon && <Icon className={`w-4 h-4 ${iconColor[color] || iconColor.slate}`} />}
      </div>
      <p className="text-2xl font-semibold text-slate-900 mt-2 tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {trend && <p className="text-xs text-emerald-700 mt-2">{trend}</p>}
    </div>
  );
};
