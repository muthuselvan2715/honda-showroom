export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatINRDecimal = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return String(dateStr);
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return String(dateStr);
  }
};

export const getStatusBadgeColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'reserved':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'sold':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'partial':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'pending':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'scheduled':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};
