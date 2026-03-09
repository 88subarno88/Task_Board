import { Response } from 'express';
import { AuthRequest } from '../types/commontypes';
import * as notificationService from '../services/notificationservice';
import { asyncHandler } from '../middleware/errorHandler';

export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  const notifications = await notificationService.getNotificationsByUser(userId);
  res.status(200).json({ success: true, data: notifications });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  const result = await notificationService.getUnreadCount(userId);
  res.status(200).json({ success: true, data: result });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  const notification = await notificationService.markAsRead(
    req.params.notificationId as string,
    userId
  );
  res.status(200).json({ success: true, data: notification });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  const result = await notificationService.markAllAsRead(userId);
  res.status(200).json({ success: true, data: result });
});