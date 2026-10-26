import { body } from 'express-validator';

export const createSaleValidator = [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('bikeUnit').isMongoId().withMessage('Valid bike physical unit ID is required'),
  body('insuranceCharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Insurance charge must be non-negative'),
  body('rtoRegistrationCharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('RTO charge must be non-negative'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be non-negative'),
  body('accessoriesList')
    .optional()
    .isArray()
    .withMessage('Accessories must be an array'),
  body('advancePayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Advance payment must be non-negative'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'upi', 'card', 'bank_transfer', 'cheque'])
    .withMessage('Invalid payment method'),
];

export const cancelSaleValidator = [
  body('reason').trim().notEmpty().withMessage('Cancellation reason is required'),
];
