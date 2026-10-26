import { Router } from 'express';
import {
  listBikeModels,
  getBikeModelById,
  createBikeModel,
  updateBikeModel,
  deleteBikeModel,
} from '../controllers/bikeModelController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';
import { bikeModelValidator } from '../validators/bikeValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Read operations accessible to authenticated users
router.get('/', authenticate, listBikeModels);
router.get('/:id', authenticate, getBikeModelById);

// Create, update, delete reserved for admin
router.post('/', authenticate, requireAdmin, bikeModelValidator, validate, createBikeModel);
router.put('/:id', authenticate, requireAdmin, updateBikeModel);
router.delete('/:id', authenticate, requireAdmin, deleteBikeModel);

export default router;
