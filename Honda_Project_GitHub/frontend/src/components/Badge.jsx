import React from 'react';
import { getStatusBadgeColor } from '../utils/formatters';

const prettify = (value) =>
  String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const Badge = ({ status, children, className = '' }) => {
  const colorClass = getStatusBadgeColor(status || children);
  const content = children ?? status;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass} ${className}`}
    >
      {typeof content === 'string' ? prettify(content) : content}
    </span>
  );
};
