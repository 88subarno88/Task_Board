import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { ApiResponse } from '../types/commontypes';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error('Error caught in errorHandler:', err);

  let statusCode = 500;
  let message = 'Internal Server Error . Please Check server logs';
  let errors: string[] | undefined;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Database validation failed. Please check the provided data.';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.[0] || 'field';
      message = `This ${field} is already in use.`;
    } else if (err.code === 'P2003') {
      message = 'Operation failed: A related record does not exist.';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'The requested database record was not found.';
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };

  res.status(statusCode).json(response);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(404, `API Route Not Found: ${req.originalUrl}`);
  next(error);
}
