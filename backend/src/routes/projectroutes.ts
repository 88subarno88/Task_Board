import { Router } from 'express';
import * as projectcontroller from '../controllers/projectcontroller';
import { authenticate } from '../middleware/auth';
import { requireProjectadmin, requireProjectviewer } from '../middleware/rolebasedcontroller';

const router = Router();

router.use(authenticate);

router.post('/', projectcontroller.createProject);
router.get('/', projectcontroller.getAllProjects);

router.get('/:projectId', requireProjectviewer, projectcontroller.getProjectById);
router.put('/:projectId', requireProjectadmin, projectcontroller.updateProject);
router.delete('/:projectId', requireProjectadmin, projectcontroller.deleteProject);

router.get('/:projectId/members', requireProjectviewer, projectcontroller.getProjectMembers);
router.post('/:projectId/members', requireProjectadmin, projectcontroller.addMember);
router.put('/:projectId/members/:userId', requireProjectadmin, projectcontroller.updateMemberRole);
router.delete('/:projectId/members/:userId', requireProjectadmin, projectcontroller.removeMember);

export default router;
