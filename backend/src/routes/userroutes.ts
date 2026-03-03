import { Router } from 'express';
import {
  getMe,
  updateUserProfile,
  getUserProjects,
  getAllUsers,
  getUserbyId,
  updateUserrole,
  deleteUser,
} from '../controllers/usercontroller';
import { authenticate } from '../middleware/auth';
import { requireGlobaladmin } from '../middleware/rolebasedcontroller';

const router = Router();

router.use(authenticate);
//for users
router.get('/me', getMe);
router.put('/me', updateUserProfile);
router.get('/me/projects', getUserProjects);

router.get('/:userId', getUserbyId);

//for globaladmin
router.get('/', requireGlobaladmin, getAllUsers);
router.put('/:userId/role', requireGlobaladmin, updateUserrole);
router.delete('/:userId', requireGlobaladmin, deleteUser);

export default router;
