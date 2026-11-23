import { Repository } from 'typeorm';
import { PaginationQuery } from '../../common/dto/pagination.dto';
import { AppDataSource } from '../../db/data-source';
import { CreateEventInput, UpdateEventInput } from '../dto/event.dto';
import { Event } from '../entities/Event.entity';

export class EventRepository {
  private readonly repo: Repository<Event>;

  constructor() {
    this.repo = AppDataSource.getRepository(Event);
  }

  public async findAllPaginated(
    pagination: PaginationQuery,
  ): Promise<{ items: Event[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      order: { date: 'ASC', createdAt: 'DESC' },
      take: pagination.limit,
      skip: pagination.offset,
    });

    return { items, total };
  }

  public async findById(id: string): Promise<Event | null> {
    return this.repo.findOne({ where: { id } });
  }

  public async createAndSave(input: CreateEventInput): Promise<Event> {
    const event = this.repo.create({
      name: input.name,
      description: input.description,
      date: input.date,
      location: input.location,
      maxParticipants: input.maxParticipants,
    });
    return this.repo.save(event);
  }

  public async updateAndSave(
    event: Event,
    input: UpdateEventInput,
  ): Promise<Event> {
    if (input.name !== undefined) event.name = input.name;
    if (input.description !== undefined) event.description = input.description;
    if (input.date !== undefined) event.date = input.date;
    if (input.location !== undefined) event.location = input.location;
    if (input.maxParticipants !== undefined) {
      event.maxParticipants = input.maxParticipants;
    }

    return this.repo.save(event);
  }

  public async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  public async countParticipants(eventId: string): Promise<number> {
    const result = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('participants', 'p')
      .where('p.event_id = :eventId', { eventId })
      .getRawOne<{ count: string }>();

    return Number(result?.count ?? 0);
  }
}
