import { Router } from 'express';
import * as boardController from '../controllers/boardcontroller';
import { authenticate } from '../middleware/auth';

const router = Router();

// all board routes require login
router.use(authenticate);

// board routes
router.post('/', boardController.createBoard);
router.get('/', boardController.getBoardsByProject);
router.get('/:boardId', boardController.getBoardById);
router.put('/:boardId', boardController.updateBoard);
router.delete('/:boardId', boardController.deleteBoard);

// column routes
router.post('/:boardId/columns', boardController.addColumn);
router.put('/:boardId/columns/reorder', boardController.reorderColumns);
router.put('/:boardId/columns/:columnId', boardController.updateColumn);
router.delete('/:boardId/columns/:columnId', boardController.deleteColumn);

// wip limit check
router.get('/:boardId/columns/:columnId/check-wip', boardController.checkWipLimit);

export default router;