import { body } from 'express-validator';

export const customerValidator = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone')
    .trim()
    .matches(/^[0-9+ -]{10,15}$/)
    .withMessage('A valid 10-15 digit phone number is required'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Must provide a valid email format')
    .normalizeEmail(),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
];

export const enquiryValidator = [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('bikeModel').isMongoId().withMessage('Valid bike model ID is required'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'test_ride_scheduled', 'negotiating', 'converted', 'lost'])
    .withMessage('Invalid enquiry status'),
];

export const testRideValidator = [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('bikeModel').isMongoId().withMessage('Valid bike model ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('timeSlot').trim().notEmpty().withMessage('Time slot is required'),
  body('licenseNumber').trim().notEmpty().withMessage('Driving license number is required for test ride'),
];
