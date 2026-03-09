import { Router } from 'express';
import * as commentController from '../controllers/commentcontroller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', commentController.addComment);
router.get('/issue/:issueId', commentController.getCommentsByIssue);
router.put('/:commentId', commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);

export default router;