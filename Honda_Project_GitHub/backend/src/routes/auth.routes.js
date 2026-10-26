import { Router } from 'express';
import { login, getMe, registerStaff, listUsers, toggleUserStatus } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { loginValidator, registerUserValidator } from '../validators/authValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/login', loginValidator, validate, login);
router.get('/me', authenticate, getMe);

// Admin-only user management
router.post('/users', authenticate, requireAdmin, registerUserValidator, validate, registerStaff);
router.get('/users', authenticate, requireAdmin, listUsers);
router.patch('/users/:id/toggle-status', authenticate, requireAdmin, toggleUserStatus);

export default router;
