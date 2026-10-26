import { AuditLog } from '../models/AuditLog.js';

export async function logAudit({
  action,
  entity,
  entityId,
  user,
  details = '',
  ipAddress = '',
}) {
  try {
    const userName = user?.name || (user ? `${user.role || 'User'}` : 'System');
    const userRole = user?.role || 'system';
    const userId = user?._id || user?.id || null;

    // Sanitize details if object
    let safeDetails = details;
    if (typeof details === 'object' && details !== null) {
      const copy = { ...details };
      delete copy.password;
      delete copy.token;
      delete copy.authorization;
      safeDetails = JSON.stringify(copy);
    }

    await AuditLog.create({
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      user: userId,
      userName,
      userRole,
      details: String(safeDetails),
      ipAddress,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
}
