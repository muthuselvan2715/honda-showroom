import React from 'react';
import { getStatusBadgeColor } from '../utils/formatters';

export const Badge = ({ status, children, className = '' }) => {
  const colorClass = getStatusBadgeColor(status || children);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${colorClass} ${className}`}
    >
      {children || status}
    </span>
  );
};
