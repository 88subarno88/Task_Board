import { Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import * as notificationService from '../services/notificationservice'

interface AuthRequest extends Request {
  user?: { userId: string; email: string; globalRole: string }
}

export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const notifications = await notificationService.getNotificationsByUser(userId)
  res.status(200).json({ success: true, data: notifications })
})

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const count = await notificationService.getUnreadCount(userId)
  res.status(200).json({ success: true, data: { count } })
})

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  const notificationId = req.params.notificationId as string
  await notificationService.markAsRead(notificationId, userId)
  res.status(200).json({ success: true, message: 'Marked as read' })
})

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId
  await notificationService.markAllAsRead(userId)
  res.status(200).json({ success: true, message: 'All marked as read' })
})