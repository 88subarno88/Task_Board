import { Response } from 'express';
import { AuthRequest } from '../types/commontypes';
import * as issueService from '../services/issueservice';
import { asyncHandler } from '../middleware/errorHandler';

export const createIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { title, type, boardId, columnId } = req.body;
  if (!title || !type || !boardId || (type !== 'STORY' && !columnId)) {
    res
      .status(400)
      .json({
        success: false,
        message: 'title, type, boardId and columnId are required for Task/Bugs',
      });
    return;
  }

  const issue = await issueService.createIssue(userId, req.body);
  res.status(201).json({ success: true, data: issue });
});

export const getIssuesByBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = {
    boardId: req.query.boardId as string,
    columnId: req.query.columnId as string,
    assigneeId: req.query.assigneeId as string,
    type: req.query.type as any,
    priority: req.query.priority as any,
  };

  const issues = await issueService.getIssuesByBoard(filters);
  res.status(200).json({ success: true, data: issues });
});

export const getIssueById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const issue = await issueService.getIssueById(req.params.issueId as string);
  res.status(200).json({ success: true, data: issue });
});

export const updateIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const issue = await issueService.updateIssue(req.params.issueId as string, userId, req.body);
  res.status(200).json({ success: true, data: issue });
});

export const moveIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  if (!req.body.columnId) {
    res.status(400).json({ success: false, message: 'columnId is required' });
    return;
  }

  const issue = await issueService.moveIssue(req.params.issueId as string, userId, req.body);
  res.status(200).json({ success: true, data: issue });
});

export const deleteIssue = asyncHandler(async (req: AuthRequest, res: Response) => {
  await issueService.deleteIssue(req.params.issueId as string);
  res.status(200).json({ success: true, message: 'Issue deleted' });
});

export const getIssueAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await issueService.getIssueAuditLogs(req.params.issueId as string);
  res.status(200).json({ success: true, data: logs });
});
