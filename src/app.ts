import express, { Express } from 'express';
import { HttpStatus, NotFoundError } from './common/errors/AppError';
import { errorHandler } from './common/middlewares/errorHandler';

export const createApp = (): Express => {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(HttpStatus.OK).json({ status: 'ok' });
  });

  app.use((_req, _res, next) => {
    next(new NotFoundError('Route not found'));
  });

  app.use(errorHandler);

  return app;
};
