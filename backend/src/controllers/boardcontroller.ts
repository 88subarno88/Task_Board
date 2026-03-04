import { Request, Response } from 'express';
import * as boardService from '../services/boardservice';
import { asyncHandler } from '../middleware/errorHandler';

// create a new board for a project
export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const { name, projectId } = req.body;

  if (!name || !projectId) {
    res.status(400).json({ success: false, message: 'name and projectId are required' });
    return;
  }

  const board = await boardService.createBoard({ name, projectId });
  res.status(201).json({ success: true, data: board });
});

// get all boards belonging to a project
export const getBoardsByProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;

  if (!projectId) {
    res.status(400).json({ success: false, message: 'projectId query param is required' });
    return;
  }

  const boards = await boardService.getBoardsByProject(projectId);
  res.status(200).json({ success: true, data: boards });
});

// get a single board with all its columns and issues
export const getBoardById = asyncHandler(async (req: Request, res: Response) => {
  const board = await boardService.getBoardById(req.params.boardId as string);
  res.status(200).json({ success: true, data: board });
});

// update board name
export const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const board = await boardService.updateBoard(req.params.boardId as string, req.body);
  res.status(200).json({ success: true, data: board });
});

// delete a board entirely
export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  await boardService.deleteBoard(req.params.boardId as string);
  res.status(200).json({ success: true, message: 'Board deleted successfully' });
});

// add a new column to a board
export const addColumn = asyncHandler(async (req: Request, res: Response) => {
  const { name, wipLimit } = req.body;

  if (!name) {
    res.status(400).json({ success: false, message: 'Column name is required' });
    return;
  }

  const column = await boardService.addColumn(req.params.boardId as string, { name, wipLimit });
  res.status(201).json({ success: true, data: column });
});

// update a column's name or wip limit
export const updateColumn = asyncHandler(async (req: Request, res: Response) => {
  const column = await boardService.updateColumn(req.params.columnId as string, req.body);
  res.status(200).json({ success: true, data: column });
});

// delete a column (only if empty)
export const deleteColumn = asyncHandler(async (req: Request, res: Response) => {
  await boardService.deleteColumn(req.params.columnId as string);
  res.status(200).json({ success: true, message: 'Column deleted' });
});

// reorder columns after drag and drop
export const reorderColumns = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.columns || !Array.isArray(req.body.columns)) {
    res.status(400).json({ success: false, message: 'columns array is required' });
    return;
  }

  const columns = await boardService.reorderColumns(req.params.boardId as string, req.body);
  res.status(200).json({ success: true, data: columns });
});

// check if a column has room based on its wip limit
export const checkWipLimit = asyncHandler(async (req: Request, res: Response) => {
  const result = await boardService.checkWipLimit(req.params.columnId as string);
  res.status(200).json({ success: true, data: result });
});