import { SortDirectionEnum } from '../types/sortDirection.js';
import { z } from 'zod';

export const sortDefinitionSchema = z.object({
	field: z.string().describe('The field name to sort by.'),
	direction: SortDirectionEnum.describe('Sort order: asc for ascending, desc for descending.')
});

export type SortDefinition = z.infer<typeof sortDefinitionSchema>;