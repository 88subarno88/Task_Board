import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateCommentInput, UpdateCommentInput } from '../types/commenttypes';

const commentInclude = {
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

export const addComment = async (userId: string, data: CreateCommentInput) => {
  // check issue exists
  const issue = await prisma.issue.findUnique({ where: { id: data.issueId } });
  if (!issue) throw new AppError(404, 'Issue not found');

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      issueId: data.issueId,
      userId,
    },
    include: commentInclude,
  });

  // log comment in audit trail
  await prisma.auditLog.create({
    data: {
      issueId: data.issueId,
      userId,
      action: 'COMMENT_ADDED',
      newValue: data.content,
    },
  });
  // notify issue assignee if different from commenter
  if (issue.assigneeId && issue.assigneeId !== userId) {
    await prisma.notification.create({
      data: {
        userId: issue.assigneeId,
        type: 'COMMENT_ADDED',
        title: 'New comment on your issue',
        message: `Someone commented on issue: ${issue.title}`,
        relatedId: issue.id,
      },
    });
  }

  return comment;
};

export const getCommentsByIssue = async (issueId: string) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new AppError(404, 'Issue not found');

  return await prisma.comment.findMany({
    where: { issueId },
    include: commentInclude,
    orderBy: { createdAt: 'asc' },
  });
};

export const updateComment = async (commentId: string, userId: string, data: UpdateCommentInput) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError(404, 'Comment not found');
  // only the person who wrote it can edit it
  if (comment.userId !== userId) {
    throw new AppError(403, 'You can only edit your own comments');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: data.content },
    include: commentInclude,
  });
  // log edit in audit
  await prisma.auditLog.create({
    data: {
      issueId: comment.issueId,
      userId,
      action: 'COMMENT_EDITED',
      oldValue: comment.content,
      newValue: data.content,
    },
  });

  return updated;
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError(404, 'Comment not found');
  // only the person who wrote it can delete it
  if (comment.userId !== userId) {
    throw new AppError(403, 'You can only delete your own comments');
  }

  await prisma.comment.delete({ where: { id: commentId } });
  // log deletion in audit
  await prisma.auditLog.create({
    data: {
      issueId: comment.issueId,
      userId,
      action: 'COMMENT_DELETED',
      oldValue: comment.content,
    },
  });
};