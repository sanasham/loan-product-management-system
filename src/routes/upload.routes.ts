import { Router } from 'express';
import { UploadController } from '../controllers/UploadController';
import { authMiddleware } from '../middleware/auth.middleware';
import { fileUploadMiddleware } from '../middleware/fileUpload.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const uploadController = new UploadController();

/**
 * @route POST /api/upload
 * @desc Upload monthly loan products Excel file
 * @access Private
 */
router.post(
  '/',
  authMiddleware.authenticate,
  fileUploadMiddleware.single('file'),
  asyncHandler(uploadController.uploadFile.bind(uploadController)),
);

export default router;
