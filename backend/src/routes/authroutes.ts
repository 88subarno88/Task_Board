import { Router } from 'express';
import { register, login, refresh, logout, getCurrentUser } from '../controllers/authcontroller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', authenticate, getCurrentUser);

export default router;
