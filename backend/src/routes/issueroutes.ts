import { Router } from 'express';
import * as issueController from '../controllers/issuecontroller';
import { authenticate } from '../middleware/auth';

const router = Router();

// all routes need login
router.use(authenticate);

router.post('/', issueController.createIssue);
router.get('/', issueController.getIssuesByBoard);
router.get('/:issueId', issueController.getIssueById);
router.put('/:issueId', issueController.updateIssue);
router.patch('/:issueId/move', issueController.moveIssue);
router.delete('/:issueId', issueController.deleteIssue);

export default router;