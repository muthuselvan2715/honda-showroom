import { Router } from 'express';
import { getShowroomSettings, updateShowroomSettings } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = Router();

router.get('/', authenticate, getShowroomSettings);
router.put('/', authenticate, requireAdmin, updateShowroomSettings);

export default router;
