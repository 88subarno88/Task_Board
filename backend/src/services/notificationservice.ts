import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateNotificationInput } from '../types/notificationtypes';

export const createNotification = async (data: CreateNotificationInput) => {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId,
    },
  });
};

export const getNotificationsByUser = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) throw new AppError(404, 'Notification not found');

  // users can only mark their own notifications as read
  if (notification.userId !== userId) {
    throw new AppError(403, 'Cannot mark another user\'s notification as read');
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { message: 'All notifications marked as read' };
};

export const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { unreadCount: count };
};