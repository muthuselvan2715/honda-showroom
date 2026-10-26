import { Router } from 'express';
import {
  getSalesReport,
  getInventoryReport,
  getOutstandingBalancesReport,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/sales', authenticate, getSalesReport);
router.get('/inventory', authenticate, getInventoryReport);
router.get('/outstanding-balances', authenticate, getOutstandingBalancesReport);

export default router;
