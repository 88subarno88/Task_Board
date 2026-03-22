import { Router } from 'express';
import * as issueController from '../controllers/issuecontroller';
import { authenticate, authorizeProjectRole } from '../middleware/auth';
import { ProjectRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizeProjectRole([
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.PROJECT_MEMBER,
    ProjectRole.PROJECT_VIEWER,
  ]),
  issueController.getIssuesByBoard
);
router.get(
  '/:issueId',
  authorizeProjectRole([
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.PROJECT_MEMBER,
    ProjectRole.PROJECT_VIEWER,
  ]),
  issueController.getIssueById
);
router.get(
  '/:issueId/audit',
  authorizeProjectRole([
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.PROJECT_MEMBER,
    ProjectRole.PROJECT_VIEWER,
  ]),
  issueController.getIssueAuditLogs
);
router.post(
  '/',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN, ProjectRole.PROJECT_MEMBER]),
  issueController.createIssue
);
router.put(
  '/:issueId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN, ProjectRole.PROJECT_MEMBER]),
  issueController.updateIssue
);
router.patch(
  '/:issueId/move',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN, ProjectRole.PROJECT_MEMBER]),
  issueController.moveIssue
);
router.delete(
  '/:issueId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  issueController.deleteIssue
);

export default router;
