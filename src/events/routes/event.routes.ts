import { Router } from 'express';
import { paginationQuerySchema } from '../../common/dto/pagination.dto';
import { authenticate } from '../../common/middlewares/authMiddleware';
import { validateRequest } from '../../common/middlewares/validateRequest';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ParticipantController } from '../../participants/controllers/ParticipantController';
import { EventController } from '../controllers/EventController';
import {
  createEventSchema,
  eventIdParamSchema,
  updateEventSchema,
} from '../dto/event.dto';

export const createEventRouter = (): Router => {
  const router = Router();
  const eventController = new EventController();
  const participantController = new ParticipantController();

  router.get(
    '/',
    validateRequest(paginationQuerySchema, 'query'),
    asyncHandler(eventController.list),
  );

  router.get(
    '/my',
    authenticate,
    validateRequest(paginationQuerySchema, 'query'),
    asyncHandler(eventController.listMyEvents),
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

  router.post(
    '/:id/register',
    authenticate,
    validateRequest(eventIdParamSchema, 'params'),
    asyncHandler(participantController.register),
  );

  return router;
};

