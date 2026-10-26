import { Router } from 'express';
import { listSales, getSaleById, createSale, cancelSale } from '../controllers/saleController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { createSaleValidator, cancelSaleValidator } from '../validators/saleValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, listSales);
router.get('/:id', authenticate, getSaleById);
router.post('/', authenticate, createSaleValidator, validate, createSale);
router.post('/:id/cancel', authenticate, requireAdmin, cancelSaleValidator, validate, cancelSale);

export default router;
