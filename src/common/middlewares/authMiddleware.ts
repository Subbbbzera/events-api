import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env';
import { ForbiddenError, UnauthorizedError, UserRole } from '../errors/AppError';
import { AuthenticatedUser } from '../types/express';

interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    next(new UnauthorizedError('Authentication token is required'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    if (!decoded.sub || !decoded.email || !decoded.role) {
      next(new UnauthorizedError('Invalid token payload'));
      return;
    }

    const user: AuthenticatedUser = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    req.user = user;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const authorizeRoles =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
