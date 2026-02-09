import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError';

export class ValidatorMiddleware {
  /**
   * Validate request using express-validator
   */
  public validate(req: Request, res: Response, next: NextFunction): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join(', ');
      // errorMessages: string
      throw new AppError(`Validation failed: ${errorMessages}`, 400);
    }

    next();
  }
}

export const validatorMiddleware = new ValidatorMiddleware();