import { Router } from 'express';
import { listTestRides, createTestRide, updateTestRide } from '../controllers/testRideController.js';
import { authenticate } from '../middleware/auth.js';
import { testRideValidator } from '../validators/customerValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, listTestRides);
router.post('/', authenticate, testRideValidator, validate, createTestRide);
router.put('/:id', authenticate, updateTestRide);

export default router;
