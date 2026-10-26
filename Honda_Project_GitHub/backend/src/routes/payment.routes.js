import { Router } from 'express';
import { listPayments, recordPayment } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { recordPaymentValidator } from '../validators/paymentValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, listPayments);
router.post('/', authenticate, recordPaymentValidator, validate, recordPayment);

export default router;
