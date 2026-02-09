import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

// Simple authentication middleware (replace with JWT in production)
export class AuthMiddleware {
  /**
   * Authenticate user
   * In production, this should verify JWT token
   */
  public authenticate(req: Request, res: Response, next: NextFunction): void {
    // For demo purposes, we'll accept a username from headers
    // In production, implement proper JWT authentication
    const username = req.headers['x-username'] as string;

    if (!username) {
      throw new AppError(
        'Authentication required. Provide x-username header',
        401,
      );
    }

    // Attach user to request
    (req as any).user = {
      username,
    };

    next();
  }
}

export const authMiddleware = new AuthMiddleware();
