import { body } from 'express-validator';

export const bikeModelValidator = [
  body('modelName').trim().notEmpty().withMessage('Model name is required'),
  body('variant').trim().notEmpty().withMessage('Variant is required'),
  body('modelYear')
    .isInt({ min: 2000, max: 2035 })
    .withMessage('Valid model year is required (e.g. 2026)'),
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base ex-showroom price must be a positive number'),
  body('engineCapacityCc')
    .isFloat({ min: 50 })
    .withMessage('Engine capacity must be at least 50cc'),
  body('reorderThreshold')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reorder threshold must be at least 1'),
];

export const bikeUnitValidator = [
  body('chassisNumber')
    .trim()
    .toUpperCase()
    .isLength({ min: 10, max: 20 })
    .withMessage('Chassis/VIN number must be between 10 and 20 alphanumeric characters'),
  body('engineNumber')
    .trim()
    .toUpperCase()
    .isLength({ min: 6, max: 25 })
    .withMessage('Engine number must be between 6 and 25 characters'),
  body('model').isMongoId().withMessage('Valid bike model ID is required'),
  body('colour').trim().notEmpty().withMessage('Colour is required'),
  body('variant').trim().notEmpty().withMessage('Variant is required'),
  body('purchaseCost')
    .isFloat({ min: 0 })
    .withMessage('Purchase cost must be a positive number'),
  body('status')
    .optional()
    .isIn(['available', 'reserved', 'sold'])
    .withMessage('Invalid unit status'),
];
