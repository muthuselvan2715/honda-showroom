import { Router } from 'express';
import { getShowroomSettings, updateShowroomSettings, clearBusinessData } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = Router();

router.get('/', authenticate, getShowroomSettings);
router.put('/', authenticate, requireAdmin, updateShowroomSettings);
router.post('/clear-data', authenticate, requireAdmin, clearBusinessData);

export default router;
