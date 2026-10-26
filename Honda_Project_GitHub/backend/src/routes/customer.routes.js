import { Router } from 'express';
import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { customerValidator } from '../validators/customerValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, listCustomers);
router.get('/:id', authenticate, getCustomerById);
router.post('/', authenticate, customerValidator, validate, createCustomer);
router.put('/:id', authenticate, updateCustomer);

export default router;
