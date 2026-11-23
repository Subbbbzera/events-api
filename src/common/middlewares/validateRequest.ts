import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type RequestTarget = 'body' | 'query' | 'params';

export const validateRequest =
  <T>(schema: ZodSchema<T>, target: RequestTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
