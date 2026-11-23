import { Request, Response } from 'express';
import { HttpStatus, UnauthorizedError } from '../../common/errors/AppError';
import { EventIdParam } from '../../events/dto/event.dto';
import { ParticipantService } from '../services/ParticipantService';

export class ParticipantController {
  private readonly participantService: ParticipantService;

  constructor(participantService = new ParticipantService()) {
    this.participantService = participantService;
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id: eventId } = req.params as unknown as EventIdParam;
    const result = await this.participantService.registerForEvent(
      eventId,
      req.user.id,
    );

    res.status(HttpStatus.CREATED).json(result);
  };
}
