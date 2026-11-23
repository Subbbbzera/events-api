import { z } from 'zod';

export const MAX_PAGINATION_LIMIT = 100;
export const DEFAULT_PAGINATION_LIMIT = 10;

export const paginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(MAX_PAGINATION_LIMIT, `Limit cannot exceed ${MAX_PAGINATION_LIMIT}`)
    .default(DEFAULT_PAGINATION_LIMIT),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResponseDto<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
