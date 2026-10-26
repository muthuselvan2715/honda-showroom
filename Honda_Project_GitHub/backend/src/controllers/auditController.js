import { AuditLog } from '../models/AuditLog.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      logs,
    });
  } catch (error) {
    next(error);
  }
};
