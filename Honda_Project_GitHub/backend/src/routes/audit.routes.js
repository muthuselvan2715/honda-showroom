import { Router } from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = Router();

router.get('/', authenticate, requireAdmin, listAuditLogs);

export default router;
