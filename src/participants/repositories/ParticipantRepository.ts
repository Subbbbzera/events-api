import { EntityManager } from 'typeorm';
import { ConflictError, NotFoundError } from '../../common/errors/AppError';
import { AppDataSource } from '../../db/data-source';
import { Event } from '../../events/entities/Event.entity';
import { Participant } from '../entities/Participant.entity';

export class ParticipantRepository {
  /**
   * Registers a user for an event inside an ACID transaction
   * using pessimistic row-level locking (`SELECT ... FOR UPDATE`) on the Event row.
   */
  public async registerWithLock(
    eventId: string,
    userId: string,
  ): Promise<Participant> {
    return AppDataSource.transaction(async (manager: EntityManager) => {
      // 1. Lock the Event row exclusively until transaction commits/rolls back
      const event = await manager
        .getRepository(Event)
        .createQueryBuilder('event')
        .setLock('pessimistic_write')
        .where('event.id = :eventId', { eventId })
        .getOne();

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const participantRepo = manager.getRepository(Participant);

      // 2. Check if this user is already registered for this event
      const existingRegistration = await participantRepo.findOne({
        where: { eventId, userId },
      });

      if (existingRegistration) {
        throw new ConflictError('User is already registered for this event');
      }

      // 3. Count currently committed participants while holding the event lock
      const currentCount = await participantRepo.count({
        where: { eventId },
      });

      if (currentCount >= event.maxParticipants) {
        throw new ConflictError('Event has reached maximum participants limit');
      }

      // 4. Insert the new participant record
      const participant = participantRepo.create({
        eventId,
        userId,
      });

      return participantRepo.save(participant);
    });
  }
}
