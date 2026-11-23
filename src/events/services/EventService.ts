import {
  PaginatedResponseDto,
  PaginationQuery,
} from '../../common/dto/pagination.dto';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';
import {
  CreateEventInput,
  EventResponseDto,
  toEventResponseDto,
  UpdateEventInput,
} from '../dto/event.dto';
import { EventRepository } from '../repositories/EventRepository';

export class EventService {
  private readonly eventRepository: EventRepository;

  constructor(eventRepository = new EventRepository()) {
    this.eventRepository = eventRepository;
  }

  public async getEvents(
    pagination: PaginationQuery,
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    const { items, total } =
      await this.eventRepository.findAllPaginated(pagination);

    return {
      items: items.map(toEventResponseDto),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    };
  }

  public async getEventById(id: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return toEventResponseDto(event);
  }

  public async createEvent(input: CreateEventInput): Promise<EventResponseDto> {
    const event = await this.eventRepository.createAndSave(input);
    return toEventResponseDto(event);
  }

  public async updateEvent(
    id: string,
    input: UpdateEventInput,
  ): Promise<EventResponseDto> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (input.maxParticipants !== undefined) {
      const currentParticipants =
        await this.eventRepository.countParticipants(id);
      if (input.maxParticipants < currentParticipants) {
        throw new ConflictError(
          `Cannot set maxParticipants (${input.maxParticipants}) below current registered participants (${currentParticipants})`,
        );
      }
    }

    const updated = await this.eventRepository.updateAndSave(event, input);
    return toEventResponseDto(updated);
  }

  public async deleteEvent(id: string): Promise<void> {
    const deleted = await this.eventRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Event not found');
    }
  }
}
