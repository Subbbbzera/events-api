import { Participant } from '../entities/Participant.entity';

export interface ParticipantResponseDto {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
}

export const toParticipantResponseDto = (
  participant: Participant,
): ParticipantResponseDto => ({
  id: participant.id,
  eventId: participant.eventId,
  userId: participant.userId,
  createdAt: participant.createdAt.toISOString(),
});
