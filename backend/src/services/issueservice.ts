import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CreateIssueInput, UpdateIssueInput, MoveIssueInput, IssueFilterInput } from '../types/issuetypes';
// include this in every issue query so we always get full details
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
  // check board exists
  const board = await prisma.board.findUnique({ where: { id: data.boardId } });
  if (!board) throw new AppError(404, 'Board not found');
  // check column exists and belongs to board
  const column = await prisma.column.findUnique({ where: { id: data.columnId } });
  if (!column) throw new AppError(404, 'Column not found');
  if (column.boardId !== data.boardId) throw new AppError(400, 'Column does not belong to this board');
  // check wip limit before adding
  if (column.wipLimit) {
    const currentCount = await prisma.issue.count({ where: { columnId: data.columnId } });
    if (currentCount >= column.wipLimit) {
      throw new AppError(400, `Column "${column.name}" has reached its WIP limit of ${column.wipLimit}`);
    }
  }

  // if parentId is given make sure parent exists and is a STORY
  if (data.parentId) {
    const parent = await prisma.issue.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError(404, 'Parent issue not found');
    if (parent.type !== 'STORY') throw new AppError(400, 'Parent issue must be a STORY');
  }
  // stories cannot have a parent
  if (data.type === 'STORY' && data.parentId) {
    throw new AppError(400, 'A STORY cannot have a parent issue');
  }

  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority ?? 'MEDIUM',
      status: column.name, // status matches column name
      boardId: data.boardId,
      columnId: data.columnId,
      reporterId,
      assigneeId: data.assigneeId,
      parentId: data.parentId,
      dueDate: data.dueDate,
    },
    include: issueInclude,
  });

  return issue;
};

export const getIssuesByBoard = async (filters: IssueFilterInput) => {
  const where: any = {};

  if (filters.boardId) where.boardId = filters.boardId;
  if (filters.columnId) where.columnId = filters.columnId;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.type) where.type = filters.type;
  if (filters.priority) where.priority = filters.priority;

  return await prisma.issue.findMany({
    where,
    include: issueInclude,
    orderBy: { createdAt: 'desc' },
  });
};

export const getIssueById = async (issueId: string) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: issueInclude,
  });

  if (!issue) throw new AppError(404, 'Issue not found');
  return issue;
};

export const updateIssue = async (issueId: string, userId: string, data: UpdateIssueInput) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new AppError(404, 'Issue not found');
  // log assignee change in audit
  if (data.assigneeId !== undefined && data.assigneeId !== issue.assigneeId) {
    await prisma.auditLog.create({
      data: {
        issueId,
        userId,
        action: 'ASSIGNEE_CHANGED',
        field: 'assigneeId',
        oldValue: issue.assigneeId ?? 'none',
        newValue: data.assigneeId ?? 'none',
      },
    });
  }

  return await prisma.issue.update({
    where: { id: issueId },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
    },
    include: issueInclude,
  });
};

export const moveIssue = async (issueId: string, userId: string, data: MoveIssueInput) => {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) throw new AppError(404, 'Issue not found');
  // stories cannot be moved directly
  if (issue.type === 'STORY') {
    throw new AppError(400, 'Stories cannot be moved directly. Move child tasks instead.');
  }

  const newColumn = await prisma.column.findUnique({ where: { id: data.columnId } });
  if (!newColumn) throw new AppError(404, 'Target column not found');
  // check wip limit on target column
  if (newColumn.wipLimit) {
    const currentCount = await prisma.issue.count({ where: { columnId: data.columnId } });
    if (currentCount >= newColumn.wipLimit) {
      throw new AppError(400, `Column "${newColumn.name}" has reached its WIP limit of ${newColumn.wipLimit}`);
    }
  }

  const oldColumn = await prisma.column.findUnique({ where: { id: issue.columnId } });
  // log status change in audit
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
  // update timestamps based on column name
  const extraData: any = { status: newColumn.name };
  if (newColumn.name.toLowerCase() === 'done') extraData.resolvedAt = new Date();
  if (newColumn.name.toLowerCase() === 'closed') extraData.closedAt = new Date();

  return await prisma.issue.update({
    where: { id: issueId },
    data: { columnId: data.columnId, ...extraData },
    include: issueInclude,
  });
};

export const deleteIssue = async (issueId: string) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { children: true },
  });

  if (!issue) throw new AppError(404, 'Issue not found');
  //dont allow deleting a story that has children
  if (issue.type === 'STORY' && issue.children.length > 0) {
    throw new AppError(400, 'Delete or unlink all child issues before deleting this story');
  }

  await prisma.issue.delete({ where: { id: issueId } });
};