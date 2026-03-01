import { Request, Response, NextFunction } from 'express';
import { validateAccessToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        globalRole: string;
      };
    }
  }
}

const hasAuthHeader = (authHeader: string | undefined, res: Response): boolean => {
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'No authorization header found.',
    });
    return false;
  }
  return true;
};

const isBearerFormat = (authHeader: string, res: Response): boolean => {
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Your token format is wrong.',
    });
    return false;
  }
  return true;
};

const isUserLoggedIn = (req: Request, res: Response): boolean => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required before checking permissions.',
    });
    return false;
  }
  return true;
};

const isGlobalAdmin = (req: Request, res: Response): boolean => {
  if (req.user?.globalRole !== 'GLOBAL_ADMIN') {
    res.status(403).json({
      success: false,
      message: 'You need to be a GlobalAdmin to do this.',
    });
    return false;
  }
  return true;
};

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!hasAuthHeader(authHeader, res)) {
    return;
  }
  if (!isBearerFormat(authHeader!, res)) {
    return;
  }
  try {
    const token = authHeader!.split(' ')[1];
    const payload = validateAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      globalRole: payload.globalRole,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Your session has expired or the token is invalid.',
    });
  }
}

export function requireGlobalAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isUserLoggedIn(req, res)) {
    return;
  }
  if (!isGlobalAdmin(req, res)) {
    return;
  }

  next();
}
