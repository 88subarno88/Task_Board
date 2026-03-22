import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        globalRole: string;
      };
      projectMembership?: {
        id: string;
        projectId: string;
        userId: string;
        role: string;
        createdAt: Date;
      } | null;
    }
  }
}

export const requireGlobaladmin = (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;

  if (user != null) {
    if (user.globalRole == 'GLOBAL_ADMIN') {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Only GLOBAL_ADMIN can do this',
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: 'You have to login first',
    });
  }
};

export const requireProjectadmin = async (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;

  if (user != null) {
    if (user.globalRole == 'GLOBAL_ADMIN') {
      next();
    } else {
      let projectId: string | undefined = (req.params.projectId ||
        req.query.projectId ||
        req.body.projectId) as string | undefined;
      if (projectId != undefined) {
        try {
          let membership = await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: projectId,
                userId: user.userId,
              },
            },
          });

          if (membership != null) {
            if (membership.role == 'PROJECT_ADMIN') {
              req.projectMembership = membership;
              next();
            } else {
              res
                .status(403)
                .json({ success: false, message: 'You need to be PROJECT_ADMIN role to do this' });
            }
          } else {
            res
              .status(403)
              .json({ success: false, message: 'You are not a member of this project' });
          }
        } catch (error) {
          if (error instanceof Error) {
            next(error);
          } else {
            throw new Error('Unknown Error');
          }
        }
      } else {
        res.status(400).json({ success: false, message: 'Project ID is missing' });
      }
    }
  } else {
    res.status(401).json({ success: false, message: 'Please login first' });
  }
};

export const requireProjectmember = async (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;
  if (user != null) {
    if (user.globalRole == 'GLOBAL_ADMIN') {
      next();
    } else {
      const projectId = (req.query.projectId || req.params.projectId) as string;

      if (projectId != undefined) {
        try {
          let membership = await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: projectId,
                userId: user.userId,
              },
            },
          });

          if (membership != null) {
            if (membership.role == 'PROJECT_ADMIN' || membership.role == 'PROJECT_MEMBER') {
              req.projectMembership = membership;
              next();
            } else {
              res.status(403).json({
                success: false,
                message: 'You need to be PROJECT_MEMBER or PROJECT_ADMIN role to do this',
              });
            }
          } else {
            res
              .status(403)
              .json({ success: false, message: 'You are not a member of this project' });
          }
        } catch (error) {
          if (error instanceof Error) {
            next(error);
          } else {
            throw new Error('Unknown Error');
          }
        }
      } else {
        res.status(400).json({ success: false, message: 'Project ID is missing' });
      }
    }
  } else {
    res.status(401).json({ success: false, message: 'Please login first' });
  }
};

export const requireProjectviewer = async (req: Request, res: Response, next: NextFunction) => {
  let user = req.user;
  if (user != null) {
    if (user.globalRole == 'GLOBAL_ADMIN') {
      next();
    } else {
      let projectId: string | undefined = (req.params.projectId ||
        req.query.projectId ||
        req.body.projectId) as string | undefined;

      if (projectId != undefined) {
        try {
          let membership = await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: projectId,
                userId: user.userId,
              },
            },
          });

          if (membership != null) {
            if (
              membership.role == 'PROJECT_ADMIN' ||
              membership.role == 'PROJECT_MEMBER' ||
              membership.role == 'PROJECT_VIEWER'
            ) {
              req.projectMembership = membership;
              next();
            } else {
              res.status(403).json({
                success: false,
                message:
                  'You need to be PROJECT_VIEWER or  PROJECT_MEMBER or PROJECT_ADMIN role to do this',
              });
            }
          } else {
            res
              .status(403)
              .json({ success: false, message: 'You are not a member of this project' });
          }
        } catch (error) {
          if (error instanceof Error) {
            next(error);
          } else {
            throw new Error('Unknown Error');
          }
        }
      } else {
        res.status(400).json({ success: false, message: 'Project ID is missing' });
      }
    }
  } else {
    res.status(401).json({ success: false, message: 'Please login first' });
  }
};
