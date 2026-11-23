import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { AuthController } from '../controllers/AuthController';
import { loginSchema, registerSchema } from '../dto/auth.dto';

export const createAuthRouter = (): Router => {
  const router = Router();
  const authController = new AuthController();

  router.post(
    '/register',
    validateRequest(registerSchema, 'body'),
    asyncHandler(authController.register),
  );

  router.post(
    '/login',
    validateRequest(loginSchema, 'body'),
    asyncHandler(authController.login),
  );

  router.get('/me', authenticate, asyncHandler(authController.me));

  return router;
};
