import { body } from 'express-validator';

export const createSaleValidator = [
  // The billing screen sends either an existing customerId or a newCustomer object, plus bikeUnitId
  body('customerId')
    .if(body('newCustomer').not().exists({ values: 'falsy' }))
    .isMongoId()
    .withMessage('Please select a customer or register a new one'),
  body('newCustomer.name')
    .if(body('customerId').not().exists({ values: 'falsy' }))
    .trim()
    .notEmpty()
    .withMessage('New customer name is required'),
  body('newCustomer.phone')
    .if(body('customerId').not().exists({ values: 'falsy' }))
    .trim()
    .matches(/^[0-9+ -]{10,15}$/)
    .withMessage('New customer phone number must be 10 to 15 digits'),
  body('bikeUnitId').isMongoId().withMessage('Please select an available bike unit (chassis number)'),
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
