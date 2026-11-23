import { NextFunction, Request, Response } from 'express';
import { ZodType, ZodTypeDef } from 'zod';

type RequestTarget = 'body' | 'query' | 'params';

export const validateRequest =
  <Output, Input = unknown>(
    schema: ZodType<Output, ZodTypeDef, Input>,
    target: RequestTarget = 'body',
  ) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };

