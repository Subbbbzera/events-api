import { z } from 'zod';
import { Event } from '../entities/Event.entity';

export const eventIdParamSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});

export const createEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be at most 255 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description must be at most 5000 characters'),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO 8601 datetime string' })
    .transform((val) => new Date(val)),
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(255, 'Location must be at most 255 characters'),
  maxParticipants: z
    .number()
    .int('maxParticipants must be an integer')
    .positive('maxParticipants must be greater than 0'),
});

export const updateEventSchema = createEventSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type EventIdParam = z.infer<typeof eventIdParamSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export interface EventResponseDto {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  maxParticipants: number;
  createdAt: string;
  updatedAt: string;
}

export const toEventResponseDto = (event: Event): EventResponseDto => ({
  id: event.id,
  name: event.name,
  description: event.description,
  date: event.date.toISOString(),
  location: event.location,
  maxParticipants: event.maxParticipants,
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString(),
});
