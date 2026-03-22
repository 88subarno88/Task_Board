import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { notifyAssignment, notifyStatusChange } from './notificationservice';
import type {
  CreateIssueInput,
  UpdateIssueInput,
  MoveIssueInput,
  IssueFilterInput,
} from '../types/issuetypes';

const validTransitions: Record<string, string[]> = {
  'To Do': ['In Progress'],
  'In Progress': ['Review', 'To Do'],
  Review: ['Done', 'In Progress'],
  Done: ['To Do'],
};

const issueInclude = {
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  reporter: { select: { id: true, name: true, email: true } },
  column: { select: { id: true, name: true, wipLimit: true } },
  children: { select: { id: true, title: true, type: true, status: true } },
  comments: {
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

export const createIssue = async (reporterId: string, data: CreateIssueInput) => {
  const board = await prisma.board.findUnique({ where: { id: data.boardId } });
  if (!board) throw new AppError(404, 'Board not found');

  const column = await prisma.column.findUnique({ where: { id: data.columnId } });
  if (!column) throw new AppError(404, 'Column not found');

  if (column.wipLimit) {
    const currentCount = await prisma.issue.count({ where: { columnId: data.columnId } });
    if (currentCount >= column.wipLimit) {
      throw new AppError(
        400,
        `Column "${column.name}" has reached its WIP limit of ${column.wipLimit}`
      );
    }
  }

  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority ?? 'MEDIUM',
      status: column.name,
      boardId: data.boardId,
      columnId: data.columnId,
      reporterId,
      assigneeId: data.assigneeId,
      parentId: data.parentId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: issueInclude,
  });
  if (issue.assigneeId) {
    await notifyAssignment(issue.id, issue.assigneeId, reporterId);
  }

  return issue;
};

export const updateIssue = async (issueId: string, userId: string, data: UpdateIssueInput) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new AppError(404, 'Issue not found');

  const cleanAssigneeId = data.assigneeId === '' ? null : data.assigneeId;
  const cleanParentId = data.parentId === '' ? null : data.parentId;

  if (cleanAssigneeId !== undefined && cleanAssigneeId !== issue.assigneeId) {
    await prisma.auditLog.create({
      data: {
        issueId,
        userId,
        action: 'ASSIGNEE_CHANGED',
        field: 'assigneeId',
        oldValue: issue.assigneeId ?? 'none',
        newValue: cleanAssigneeId ?? 'none',
      },
    });
    if (cleanAssigneeId) {
      await notifyAssignment(issueId, cleanAssigneeId, userId);
    }
  }

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigneeId: cleanAssigneeId,
      parentId: cleanParentId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: issueInclude,
  });

  if (cleanParentId || issue.parentId) {
    await updateParentStory(cleanParentId || issue.parentId!);
  }

  return updated;
};

export const moveIssue = async (issueId: string, userId: string, data: MoveIssueInput) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { children: true },
  });

  if (!issue) throw new AppError(404, 'Issue not found');

  const newColumn = await prisma.column.findUnique({ where: { id: data.columnId } });
  if (!newColumn) throw new AppError(404, 'Target column not found');

  const currentStatus = issue.status;
  const newStatus = newColumn.name;

  if (currentStatus !== newStatus) {
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(400, `Cannot move from "${currentStatus}" to "${newStatus}"`);
    }
  }

  if (issue.type === 'STORY' && issue.children.length > 0) {
    const childrenStatuses = issue.children.map((c) => c.status);

    if (newStatus === 'Done' && !childrenStatuses.every((s) => s === 'Done')) {
      throw new AppError(400, 'Cannot move Story to "Done" while tasks are unfinished.');
    }

    if (
      newStatus === 'Review' &&
      childrenStatuses.some((s) => s === 'To Do' || s === 'In Progress')
    ) {
      throw new AppError(400, 'Cannot move Story to "Review" while tasks are still In Progress.');
    }
  }

  const oldColumn = issue.columnId
    ? await prisma.column.findUnique({ where: { id: issue.columnId } })
    : null;

  await prisma.auditLog.create({
    data: {
      issueId,
      userId,
      action: 'STATUS_CHANGED',
      field: 'status',
      oldValue: oldColumn?.name ?? issue.status,
      newValue: newColumn.name,
    },
  });

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: {
      columnId: data.columnId,
      status: newColumn.name,
      closedAt: newStatus === 'Done' ? new Date() : undefined,
    },
    include: issueInclude,
  });
  await notifyStatusChange(issueId, newStatus, userId);
  if (issue.parentId) await updateParentStory(issue.parentId);

  return updated;
};

export const getIssuesByBoard = async (filters: IssueFilterInput) => {
  const where: any = {};
  if (filters.boardId) where.boardId = filters.boardId;
  return await prisma.issue.findMany({
    where,
    include: issueInclude,
    orderBy: { createdAt: 'desc' },
  });
};

export const getIssueById = async (issueId: string) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId }, include: issueInclude });
  if (!issue) throw new AppError(404, 'Issue not found');
  return issue;
};

export const deleteIssue = async (issueId: string) => {
  await prisma.issue.delete({ where: { id: issueId } });
};

const updateParentStory = async (parentId: string) => {
  const parent = await prisma.issue.findUnique({
    where: { id: parentId },
    include: { children: true },
  });
  if (!parent || parent.type !== 'STORY' || parent.children.length === 0) return;

  const statuses = parent.children.map((c) => c.status);
  let newStatus = parent.status;

  if (statuses.every((s) => s === 'Done')) newStatus = 'Done';
  else if (statuses.some((s) => s === 'In Progress' || s === 'Review')) newStatus = 'In Progress';

  if (newStatus !== parent.status) {
    const targetCol = await prisma.column.findFirst({
      where: { boardId: parent.boardId, name: newStatus },
    });
    if (targetCol) {
      await prisma.issue.update({
        where: { id: parentId },
        data: { status: newStatus, columnId: targetCol.id },
      });
    }
  }
};

export const getIssueAuditLogs = async (issueId: string) => {
  return await prisma.auditLog.findMany({
    where: { issueId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
};
