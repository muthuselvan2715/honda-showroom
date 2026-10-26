import { Router } from 'express';
import { listEnquiries, createEnquiry, updateEnquiry } from '../controllers/enquiryController.js';
import { authenticate } from '../middleware/auth.js';
import { enquiryValidator } from '../validators/customerValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, listEnquiries);
router.post('/', authenticate, enquiryValidator, validate, createEnquiry);
router.put('/:id', authenticate, updateEnquiry);

export default router;
