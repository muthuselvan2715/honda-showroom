import { body } from 'express-validator';

export const recordPaymentValidator = [
  body('saleId').isMongoId().withMessage('Valid sale ID is required'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Payment amount must be greater than zero'),
  body('paymentMethod')
    .isIn(['cash', 'upi', 'card', 'bank_transfer', 'cheque'])
    .withMessage('Valid payment method is required'),
  body('paymentType')
    .optional()
    .isIn(['advance', 'partial', 'full_settlement'])
    .withMessage('Invalid payment type'),
  body('transactionReference')
    .optional()
    .trim(),
];
