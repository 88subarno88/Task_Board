import { Request, Response, NextFunction } from 'express';
import { validateAccessToken } from '../utils/jwt';
import prisma from '../config/database';
import { ProjectRole } from '@prisma/client';
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
export function authorizeProjectRole(allowedRoles: ProjectRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (req.user.globalRole === 'GLOBAL_ADMIN') {
      return next();
    }

    let projectId = req.params.projectId || req.body?.projectId || (req.query.projectId as string);
   
    if (!projectId) {
    
      if (!projectId) {
        const boardId = (req.params.boardId || req.query.boardId) as string;
        if (boardId) {
          const board = await prisma.board.findUnique({
            where: { id: boardId },
            select: { projectId: true },
          });
          if (!board) {
            return res.status(404).json({ success: false, message: 'Board not found.' });
          }
          projectId = board.projectId;
        }
      }

      if (!projectId) {
        const issueId = (req.params.issueId || req.query.issueId) as string;
        if (issueId) {
          const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            select: { boardId: true },
          });
          if (!issue) {
            return res.status(404).json({ success: false, message: 'Issue not found.' });
          }
          const board = await prisma.board.findUnique({
            where: { id: issue.boardId },
            select: { projectId: true },
          });
          if (!board) {
            return res.status(404).json({ success: false, message: 'Board not found.' });
          }
          projectId = board.projectId;
        }
      }
    }

   

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required.' });
    }

    try {
  
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: String(projectId),
            userId: req.user.userId,
          },
        },
      });

      if (!membership) {
        return res
          .status(403)
          .json({ success: false, message: 'You are not a member of this project.' });
      }
      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}`,
        });
      }
      next();
    } catch (error) {
      console.error('Authorization Error:', error);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error during authorization.' });
    }
  };
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
