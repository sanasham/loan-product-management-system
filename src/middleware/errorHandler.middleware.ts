import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.config';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.message.includes('File too large')) {
      return res.status(413).json({
        success: false,
        error: 'File size exceeds limit (10MB)',
      });
    }
  }

  // Default error
  return res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
};
