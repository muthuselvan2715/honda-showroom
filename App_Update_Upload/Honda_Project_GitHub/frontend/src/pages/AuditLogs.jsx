import React, { useState, useEffect } from 'react';
import { ShieldAlert, Filter, Activity, Clock, User, Globe } from 'lucide-react';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { formatDateTime } from '../utils/formatters';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [total, setTotal] = useState(0);

  const { showError } = useNotification();

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { ...(actionFilter && { action: actionFilter }), limit: 50 },
      });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      showError('Failed to fetch audit history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500 mt-1">Every login, sale, payment and settings change – who did it and when.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-red-600"
          >
            <option value="">All Actions</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="CREATE_SALE">Sales Generated</option>
            <option value="CANCEL_SALE">Sales Cancelled</option>
            <option value="ADD_PAYMENT">Payments Logged</option>
            <option value="ADD_BIKE_UNIT">Units Stocked In</option>
            <option value="UPDATE_SETTINGS">Settings Changed</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">{total} Logged Events</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Responsible User</th>
                <th className="py-3 px-4">Details & Payload Summary</th>
                <th className="py-3 px-4 font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.entity}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">No audit log events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
