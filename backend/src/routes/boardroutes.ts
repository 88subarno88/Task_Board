import { Router } from 'express';
import * as boardController from '../controllers/boardcontroller';
import { authenticate, authorizeProjectRole } from '../middleware/auth';
import { ProjectRole } from '@prisma/client';

const router = Router();

// all board routes require login
router.use(authenticate);


router.get(
  '/',
  authorizeProjectRole([
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.PROJECT_MEMBER,
    ProjectRole.PROJECT_VIEWER,
  ]),
  boardController.getBoardsByProject
);
router.get(
  '/:boardId',
  authorizeProjectRole([
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.PROJECT_MEMBER,
    ProjectRole.PROJECT_VIEWER,
  ]),
  boardController.getBoardById
);
router.post('/', authorizeProjectRole([ProjectRole.PROJECT_ADMIN]), boardController.createBoard);
router.put(
  '/:boardId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  boardController.updateBoard
);
router.delete(
  '/:boardId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  boardController.deleteBoard
);

// column routes
router.post(
  '/:boardId/columns',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  boardController.addColumn
);
router.put(
  '/:boardId/columns/reorder',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  boardController.reorderColumns
);
router.put(
  '/:boardId/columns/:columnId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  boardController.updateColumn
);
router.delete(
  '/:boardId/columns/:columnId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  boardController.deleteColumn
);
// wip limit check
router.get('/:boardId/columns/:columnId/check-wip', boardController.checkWipLimit);

export default router;
