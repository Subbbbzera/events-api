import { Router } from 'express';
import { paginationQuerySchema } from '../../common/dto/pagination.dto';
import { authenticate } from '../../common/middlewares/authMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { EventController } from '../controllers/EventController';
import {
  createEventSchema,
  eventIdParamSchema,
  updateEventSchema,
} from '../dto/event.dto';

export const createEventRouter = (): Router => {
  const router = Router();
  const eventController = new EventController();

  router.get(
    '/',
    validateRequest(paginationQuerySchema, 'query'),
    asyncHandler(eventController.list),
  );

  router.get(
    '/:id',
    validateRequest(eventIdParamSchema, 'params'),
    asyncHandler(eventController.getById),
  );

  router.post(
    '/',
    authenticate,
    validateRequest(createEventSchema, 'body'),
    asyncHandler(eventController.create),
  );

  router.patch(
    '/:id',
    authenticate,
    validateRequest(eventIdParamSchema, 'params'),
    validateRequest(updateEventSchema, 'body'),
    asyncHandler(eventController.update),
  );

  router.delete(
    '/:id',
    authenticate,
    validateRequest(eventIdParamSchema, 'params'),
    asyncHandler(eventController.remove),
  );

  return router;
};
