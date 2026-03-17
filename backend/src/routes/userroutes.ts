import { Router } from 'express';
import prisma from '../config/database'
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

router.get('/search', authenticate, async (req, res) => {
  const { email } = req.query
  const user = await prisma.user.findUnique({
    where: { email: email as string },
    select: { id: true, name: true, email: true }
  })
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' })
    return
  }
  res.status(200).json({ success: true, data: user })
})

router.get('/:userId', getUserbyId);

//for globaladmin
router.get('/', requireGlobaladmin, getAllUsers);
router.put('/:userId/role', requireGlobaladmin, updateUserrole);
router.delete('/:userId', requireGlobaladmin, deleteUser);

export default router;
