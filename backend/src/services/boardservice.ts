import prisma from '../config/database';
import { CreateBoardInput, UpdateBoardInput, CreateColumnInput, UpdateColumnInput, ReorderRequestBody } from '../types/boardtypes';
import { AppError } from '../middleware/errorHandler';

// handles all board and column database operations
export const createBoard = async (data: CreateBoardInput) => {
  // check the project actually exists before making a board for it
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    throw new AppError(404, 'Project not found');
  }
  // create board and add 4 default columns at the same time
  const board = await prisma.board.create({
    data: {
      name: data.name,
      projectId: data.projectId,
      columns: {
        create: [
          { name: 'To Do', position: 0 },
          { name: 'In Progress', position: 1 },
          { name: 'Review', position: 2 },
          { name: 'Done', position: 3 },
        ],
      },
    },
    include: {
      columns: { orderBy: { position: 'asc' } },
    },
  });

  return board;
};

export const getBoardsByProject = async (projectId: string) => {
  return await prisma.board.findMany({
    where: { projectId },
    include: {
      columns: { orderBy: { position: 'asc' } },
    },
  });
};

export const getBoardById = async (boardId: string) => {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { position: 'asc' },
        include: {
          issues: {
            where: { parentId: null }, // only top level issues
            include: {
              assignee: { select: { id: true, name: true, avatarUrl: true } },
              children: { select: { id: true, title: true, type: true, status: true } },
            },
          },
        },
      },
    },
  });

  if (!board) throw new AppError(404, 'Board not found');
  return board;
};

export const updateBoard = async (boardId: string, data: UpdateBoardInput) => {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');

  return await prisma.board.update({
    where: { id: boardId },
    data: { name: data.name },
  });
};

export const deleteBoard = async (boardId: string) => {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');

  await prisma.board.delete({ where: { id: boardId } });
};

export const addColumn = async (boardId: string, data: CreateColumnInput) => {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { columns: true },
  });

  if (!board) throw new AppError(404, 'Board not found');
  // new column goes at the end
  const position = board.columns.length;

  return await prisma.column.create({
    data: {
      name: data.name,
      boardId,
      position,
      wipLimit: data.wipLimit ?? null,
    },
  });
};

export const updateColumn = async (columnId: string, data: UpdateColumnInput) => {
  const column = await prisma.column.findUnique({ where: { id: columnId } });
  if (!column) throw new AppError(404, 'Column not found');

  return await prisma.column.update({
    where: { id: columnId },
    data: { name: data.name, wipLimit: data.wipLimit },
  });
};

export const deleteColumn = async (columnId: string) => {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { issues: true },
  });

  if (!column) throw new AppError(404, 'Column not found');
  // dont allow deleting a column that still has issues in it
  if (column.issues.length > 0) {
    throw new AppError(400, 'Move all issues out of this column before deleting it');
  }

  await prisma.column.delete({ where: { id: columnId } });
  // fix positions of remaining columns so there are no gaps
  const remaining = await prisma.column.findMany({
    where: { boardId: column.boardId },
    orderBy: { position: 'asc' },
  });

  for (let i = 0; i < remaining.length; i++) {
    await prisma.column.update({
      where: { id: remaining[i].id },
      data: { position: i },
    });
  }
};

export const reorderColumns = async (boardId: string, body: ReorderRequestBody) => {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');

  // update each column's position based on what frontend sends
  for (const item of body.columns) {
    await prisma.column.update({
      where: { id: item.columnId },
      data: { position: item.newPosition },
    });
  }

  return await prisma.column.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
  });
};

export const checkWipLimit = async (columnId: string) => {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { issues: true },
  });

  if (!column) throw new AppError(404, 'Column not found');
  // if no wip limit set, always allow
  if (!column.wipLimit) return { allowed: true, current: column.issues.length, limit: null };

  const allowed = column.issues.length < column.wipLimit;
  return { allowed, current: column.issues.length, limit: column.wipLimit };
};