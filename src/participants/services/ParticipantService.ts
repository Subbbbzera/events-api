import { cacheService } from '../../cache/CacheService';
import {
  ParticipantResponseDto,
  toParticipantResponseDto,
} from '../dto/participant.dto';
import { ParticipantRepository } from '../repositories/ParticipantRepository';

export class ParticipantService {
  private readonly participantRepository: ParticipantRepository;

  constructor(participantRepository = new ParticipantRepository()) {
    this.participantRepository = participantRepository;
  }

  public async registerForEvent(
    eventId: string,
    userId: string,
  ): Promise<ParticipantResponseDto> {
    const participant = await this.participantRepository.registerWithLock(
      eventId,
      userId,
    );

    await Promise.all([
      cacheService.invalidateUserEvents(userId),
      cacheService.invalidateEventsList(),
    ]);

    return toParticipantResponseDto(participant);
  }
}
