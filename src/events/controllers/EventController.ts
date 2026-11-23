import { Request, Response } from 'express';
import { PaginationQuery } from '../../common/dto/pagination.dto';
import { HttpStatus } from '../../common/errors/AppError';
import {
  CreateEventInput,
  EventIdParam,
  UpdateEventInput,
} from '../dto/event.dto';
import { EventService } from '../services/EventService';

export class EventController {
  private readonly eventService: EventService;

  constructor(eventService = new EventService()) {
    this.eventService = eventService;
  }

  public list = async (req: Request, res: Response): Promise<void> => {
    const pagination = req.query as unknown as PaginationQuery;
    const result = await this.eventService.getEvents(pagination);
    res.status(HttpStatus.OK).json(result);
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as EventIdParam;
    const result = await this.eventService.getEventById(id);
    res.status(HttpStatus.OK).json(result);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateEventInput;
    const result = await this.eventService.createEvent(input);
    res.status(HttpStatus.CREATED).json(result);
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as EventIdParam;
    const input = req.body as UpdateEventInput;
    const result = await this.eventService.updateEvent(id, input);
    res.status(HttpStatus.OK).json(result);
  };

  public remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as EventIdParam;
    await this.eventService.deleteEvent(id);
    res.status(HttpStatus.NO_CONTENT).send();
  };
}
