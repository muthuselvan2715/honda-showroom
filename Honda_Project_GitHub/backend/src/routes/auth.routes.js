import { Router } from 'express';
import { login, getMe, registerStaff, listUsers, toggleUserStatus, changePassword, resetUserPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { loginValidator, registerUserValidator, changePasswordValidator, resetPasswordValidator } from '../validators/authValidators.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/login', loginLimiter, loginValidator, validate, login);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePasswordValidator, validate, changePassword);

// Admin-only user management
router.post('/users', authenticate, requireAdmin, registerUserValidator, validate, registerStaff);
router.get('/users', authenticate, requireAdmin, listUsers);
router.patch('/users/:id/toggle-status', authenticate, requireAdmin, toggleUserStatus);
router.put('/users/:id/reset-password', authenticate, requireAdmin, resetPasswordValidator, validate, resetUserPassword);

export default router;
