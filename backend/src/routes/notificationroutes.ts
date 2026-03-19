import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as notificationController from '../controllers/notificationcontroller';

const router = Router();

router.get('/', authenticate, notificationController.getMyNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.patch('/read-all', authenticate, notificationController.markAllAsRead);
router.patch('/:notificationId/read', authenticate, notificationController.markAsRead);

export default router;
