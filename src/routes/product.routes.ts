import { Router } from 'express';
import { param, query } from 'express-validator';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware } from '../middleware/auth.middleware';
import { validatorMiddleware } from '../middleware/validator.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const productController = new ProductController();

/**
 * @route GET /api/products
 * @desc Get all products with pagination and filters
 * @access Private
 */
router.get(
  '/',
  authMiddleware.authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100'),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string'),
    query('activeOnly')
      .optional()
      .isBoolean()
      .withMessage('ActiveOnly must be a boolean'),
  ],
  validatorMiddleware.validate,
  asyncHandler(productController.getProducts.bind(productController)),
);

/**
 * @route GET /api/products/:id
 * @desc Get product by ID
 * @access Private
 */
router.get(
  '/:id',
  authMiddleware.authenticate,
  [param('id').isString().notEmpty().withMessage('Product ID is required')],
  validatorMiddleware.validate,
  asyncHandler(productController.getProductById.bind(productController)),
);

/**
 * @route GET /api/products/:id/history
 * @desc Get product pricing history
 * @access Private
 */
router.get(
  '/:id/history',
  authMiddleware.authenticate,
  [
    param('id').isString().notEmpty().withMessage('Product ID is required'),
    query('months')
      .optional()
      .isInt({ min: 1, max: 60 })
      .withMessage('Months must be between 1 and 60'),
  ],
  validatorMiddleware.validate,
  asyncHandler(productController.getProductHistory.bind(productController)),
);

export default router;
