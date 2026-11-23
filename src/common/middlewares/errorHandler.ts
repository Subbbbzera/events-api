import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';
import { AppError, HttpStatus } from '../errors/AppError';

interface PostgresDriverError extends Error {
  code?: string;
  detail?: string;
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      error: {
        message: 'Validation failed',
        details: err.errors.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof QueryFailedError) {
    const driverErr = err.driverError as PostgresDriverError | undefined;
    // PostgreSQL code 23505 = unique_violation
    if (driverErr?.code === '23505') {
      res.status(HttpStatus.CONFLICT).json({
        error: {
          message: 'Resource already exists or duplicate entry',
        },
      });
      return;
    }
    // PostgreSQL code 23503 = foreign_key_violation
    if (driverErr?.code === '23503') {
      res.status(HttpStatus.NOT_FOUND).json({
        error: {
          message: 'Referenced resource does not exist',
        },
      });
      return;
    }
  }

  console.error('Unhandled error:', err);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    error: {
      message: 'Internal server error',
    },
  });
};
