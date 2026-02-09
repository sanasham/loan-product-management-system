import { Request } from 'express';
import multer from 'multer';
import { appConfig } from '../config/app.config';
import { AppError } from '../utils/AppError';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only Excel files (.xlsx, .xls) are allowed', 400));
  }
};

// Create multer instance
export const fileUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: appConfig.upload.maxFileSize,
  },
  fileFilter,
});
