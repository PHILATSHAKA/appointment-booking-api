import { z } from 'zod';

import { sortDefinitionSchema } from '../types/sortDefinition.js';

export const paginationQuerySchema = z.object({
	limit: z.coerce
		.number()
		.nullish()
		.transform((value) => value ?? undefined)
		.describe('Maximum number of items to return per page.'),
	page: z.coerce
		.number()
		.nullish()
		.transform((value) => value ?? undefined)
		.describe('Page number to return.'),
	sort: z
		.array(sortDefinitionSchema)
		.or(z.string().nullish())

		.transform((value) => {
			if (value) {
				const parsed = typeof value === 'string' ? JSON.parse(value) : value;
				if (Array.isArray(parsed)) {
					return parsed.map((s) => sortDefinitionSchema.parse(s));
				}
			}
			return undefined;
		})
		.pipe(sortDefinitionSchema
			.array()
			.nullish()
			.transform((value) => value ?? undefined)),
	searchTerm: z
		.string()
		.nullish()
		.transform((value) => value ?? undefined)
		.describe('Optional search term to filter results.')
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;