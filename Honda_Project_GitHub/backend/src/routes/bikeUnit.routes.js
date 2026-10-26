import { Router } from 'express';
import {
  listBikeUnits,
  getBikeUnitById,
  createBikeUnit,
  updateBikeUnit,
  deleteBikeUnit,
} from '../controllers/bikeUnitController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { bikeUnitValidator } from '../validators/bikeValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, listBikeUnits);
router.get('/:id', authenticate, getBikeUnitById);
router.post('/', authenticate, bikeUnitValidator, validate, createBikeUnit);
router.put('/:id', authenticate, updateBikeUnit);
router.delete('/:id', authenticate, requireAdmin, deleteBikeUnit);

export default router;
