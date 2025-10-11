import { z } from 'zod';

export const SortDirectionEnum = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirectionEnum>;