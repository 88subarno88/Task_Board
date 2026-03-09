import { Response } from 'express';
import { AuthRequest } from '../types/commontypes';
import * as commentService from '../services/commentservice';
import { asyncHandler } from '../middleware/errorHandler';

export const addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  const { content, issueId } = req.body;
  if (!content || !issueId) {
    res.status(400).json({ success: false, message: 'content and issueId are required' });
    return;
  }

  const comment = await commentService.addComment(userId, { content, issueId });
  res.status(201).json({ success: true, data: comment });
});

export const getCommentsByIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const comments = await commentService.getCommentsByIssue(req.params.issueId as string);
  res.status(200).json({ success: true, data: comments });
});

export const updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  if (!req.body.content) {
    res.status(400).json({ success: false, message: 'content is required' });
    return;
  }

  const comment = await commentService.updateComment(
    req.params.commentId as string,
    userId,
    req.body
  );
  res.status(200).json({ success: true, data: comment });
});

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

  await commentService.deleteComment(req.params.commentId as string, userId);
  res.status(200).json({ success: true, message: 'Comment deleted' });
});