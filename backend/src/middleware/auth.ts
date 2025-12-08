import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  logger.debug(`AuthMiddleware: Processing request to ${req.path}`);
  // logger.debug(`AuthMiddleware: Headers: ${JSON.stringify(req.headers)}`); // Be careful with secrets in prod logs

  if (!token) {
    logger.debug('AuthMiddleware: No token found in Authorization header');
    req.user = undefined;
    return next();
  }

  try {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      logger.debug(`AuthMiddleware: User authenticated: ${payload.walletAddress}`);
    } else {
      logger.warn('AuthMiddleware: Invalid token provided (verifyToken returned null)');
    }
  } catch (error) {
    logger.error('AuthMiddleware: Error verifying token:', error);
  }

  next();
};
