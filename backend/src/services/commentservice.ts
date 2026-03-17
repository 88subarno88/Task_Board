import prisma from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { notifyComment, notifyMention } from './notificationservice'

const extractMentions = (content: string): string[] => {
  const matches = content.match(/@(\w+)/g)
  if (!matches) return []
  return matches.map((m) => m.substring(1))
}

export const addComment = async (issueId: string, userId: string, content: string) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } })
  if (!issue) throw new AppError(404, 'Issue not found')

  const comment = await prisma.comment.create({
    data: { content, issueId, userId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  

  // notify assignee and reporter
  await notifyComment(issueId, userId)

  // notify mentioned users
  const mentions = extractMentions(content)
  for (const username of mentions) {
    const mentionedUser = await prisma.user.findFirst({
      where: { name: { contains: username, mode: 'insensitive' } },
    })
    if (mentionedUser && mentionedUser.id !== userId) {
      await notifyMention(issueId, mentionedUser.id, userId)
    }
  }

  return comment
}

export const getCommentsByIssue = async (issueId: string) => {
  return await prisma.comment.findMany({
    where: { issueId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export const updateComment = async (commentId: string, userId: string, content: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) throw new AppError(404, 'Comment not found')
  if (comment.userId !== userId) throw new AppError(403, 'You can only edit your own comments')

  // log in audit
  await prisma.auditLog.create({
    data: {
      issueId: comment.issueId,
      userId,
      action: 'COMMENT_UPDATED',
      field: 'comment',
      oldValue: comment.content,
      newValue: content,
    },
  })

  return await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
}

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) throw new AppError(404, 'Comment not found')
  if (comment.userId !== userId) throw new AppError(403, 'You can only delete your own comments')

  // log in audit
  await prisma.auditLog.create({
    data: {
      issueId: comment.issueId,
      userId,
      action: 'COMMENT_DELETED',
      field: 'comment',
      oldValue: comment.content,
      newValue: '',
    },
  })

  await prisma.comment.delete({ where: { id: commentId } })
}