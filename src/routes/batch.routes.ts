import { Router } from 'express';
import { param } from 'express-validator';
import { BatchController } from '../controllers/BatchController';
import { authMiddleware } from '../middleware/auth.middleware';
import { validatorMiddleware } from '../middleware/validator.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const batchController = new BatchController();

/**
 * @route GET /api/batches/:batchId/status
 * @desc Get batch processing status
 * @access Private
 */
router.get(
  '/:batchId/status',
  authMiddleware.authenticate,
  [param('batchId').isUUID().withMessage('Invalid batch ID format')],
  validatorMiddleware.validate,
  asyncHandler(batchController.getBatchStatus.bind(batchController)),
);

/**
 * @route GET /api/batches/:batchId/reconciliation
 * @desc Get batch reconciliation report
 * @access Private
 */
router.get(
  '/:batchId/reconciliation',
  authMiddleware.authenticate,
  [param('batchId').isUUID().withMessage('Invalid batch ID format')],
  validatorMiddleware.validate,
  asyncHandler(batchController.getReconciliation.bind(batchController)),
);

/**
 * @route GET /api/batches
 * @desc Get all batches (with pagination)
 * @access Private
 */
router.get(
  '/',
  authMiddleware.authenticate,
  asyncHandler(batchController.getAllBatches.bind(batchController)),
);

export default router;
