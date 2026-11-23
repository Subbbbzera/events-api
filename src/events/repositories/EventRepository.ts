import { EntityManager, Repository } from 'typeorm';
import { PaginationQuery } from '../../common/dto/pagination.dto';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';
import { AppDataSource } from '../../db/data-source';
import { Participant } from '../../participants/entities/Participant.entity';
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

  public async findUserEventsPaginated(
    userId: string,
    pagination: PaginationQuery,
  ): Promise<{ items: Event[]; total: number }> {
    const [items, total] = await this.repo
      .createQueryBuilder('event')
      .innerJoin('event.participants', 'participant')
      .where('participant.userId = :userId', { userId })
      .orderBy('event.date', 'ASC')
      .addOrderBy('event.createdAt', 'DESC')
      .take(pagination.limit)
      .skip(pagination.offset)
      .getManyAndCount();

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

  public async updateWithLock(
    id: string,
    input: UpdateEventInput,
  ): Promise<Event> {
    return AppDataSource.transaction(async (manager: EntityManager) => {
      const eventRepo = manager.getRepository(Event);
      const event = await eventRepo
        .createQueryBuilder('event')
        .setLock('pessimistic_write')
        .where('event.id = :id', { id })
        .getOne();

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      if (input.maxParticipants !== undefined) {
        const currentParticipants = await manager
          .getRepository(Participant)
          .count({ where: { eventId: id } });

        if (input.maxParticipants < currentParticipants) {
          throw new ConflictError(
            `Cannot set maxParticipants (${input.maxParticipants}) below current registered participants (${currentParticipants})`,
          );
        }
        event.maxParticipants = input.maxParticipants;
      }

      if (input.name !== undefined) event.name = input.name;
      if (input.description !== undefined) event.description = input.description;
      if (input.date !== undefined) event.date = input.date;
      if (input.location !== undefined) event.location = input.location;

      return eventRepo.save(event);
    });
  }

  public async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
