import prisma from '../config/database'
import { AppError } from '../middleware/errorHandler'

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string
) => {
  return await prisma.notification.create({
    data: { userId, type, title, message, relatedId },
  })
}

export const notifyAssignment = async (issueId: string, assigneeId: string, assignedById: string) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } })
  if (!issue) return

  const assignedBy = await prisma.user.findUnique({ where: { id: assignedById }, select: { name: true } })

  await createNotification(
    assigneeId,
    'ASSIGNED',
    'You were assigned to an issue',
    `${assignedBy?.name || 'Someone'} assigned you to: ${issue.title}`,
    issueId
  )
}

export const notifyStatusChange = async (issueId: string, newStatus: string, changedById: string) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } })
  if (!issue) return

  const usersToNotify = [issue.assigneeId, issue.reporterId]
    .filter((id): id is string => id !== null && id !== changedById)

  for (const userId of usersToNotify) {
    await createNotification(
      userId,
      'STATUS_CHANGED',
      'Issue status updated',
      `${issue.title} moved to ${newStatus}`,
      issueId
    )
  }
}

export const notifyComment = async (issueId: string, commenterId: string) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } })
  if (!issue) return

  const usersToNotify = [issue.assigneeId, issue.reporterId]
    .filter((id): id is string => id !== null && id !== commenterId)

  for (const userId of usersToNotify) {
    await createNotification(
      userId,
      'COMMENT_ADDED',
      'New comment on issue',
      `New comment on: ${issue.title}`,
      issueId
    )
  }
}

export const notifyMention = async (issueId: string, mentionedUserId: string, mentionerId: string) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } })
  if (!issue) return

  const mentioner = await prisma.user.findUnique({ where: { id: mentionerId }, select: { name: true } })

  await createNotification(
    mentionedUserId,
    'MENTIONED',
    'You were mentioned',
    `${mentioner?.name || 'Someone'} mentioned you in: ${issue.title}`,
    issueId
  )
}

export const getNotificationsByUser = async (userId: string) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export const getUnreadCount = async (userId: string) => {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  })
}

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } })
  if (!notification) throw new AppError(404, 'Notification not found')
  if (notification.userId !== userId) throw new AppError(403, 'Not your notification')

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}