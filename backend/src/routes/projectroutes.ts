import { Router } from 'express';
import * as projectcontroller from '../controllers/projectcontroller';
import { authenticate, authorizeProjectRole } from '../middleware/auth';
import { requireProjectadmin, requireProjectviewer } from '../middleware/rolebasedcontroller';
import { ProjectRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.post('/', projectcontroller.createProject);
router.get('/', projectcontroller.getAllProjects);

router.get(
  '/:projectId',
  authorizeProjectRole([
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.PROJECT_MEMBER,
    ProjectRole.PROJECT_VIEWER,
  ]),
  projectcontroller.getProjectById
);
router.get(
  '/:projectId/members',
  authorizeProjectRole([
    ProjectRole.PROJECT_ADMIN,
    ProjectRole.PROJECT_MEMBER,
    ProjectRole.PROJECT_VIEWER,
  ]),
  projectcontroller.getProjectMembers
);
router.put(
  '/:projectId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  projectcontroller.updateProject
);
router.delete(
  '/:projectId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  projectcontroller.deleteProject
);

router.post(
  '/:projectId/members',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  projectcontroller.addMember
);
router.put(
  '/:projectId/members/:userId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  projectcontroller.updateMemberRole
);
router.delete(
  '/:projectId/members/:userId',
  authorizeProjectRole([ProjectRole.PROJECT_ADMIN]),
  projectcontroller.removeMember
);

export default router;
