import { FastifyZodTypeProvider } from '#src/global.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';
import { z } from 'zod';

import { createSlots, createSlotsSchema } from '#services/slots/createSlots.js';
import { authenticatedFrameworkResponses } from '#framework/types.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: createBranchesRoute.name });

/**
 * Create booking slots route.
 * @param server Fastify server instance.
 */
export default function createBranchesRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'POST',
		url: '/branches/:branchId/slots',
		schema: {
			summary: 'Create booking slots',
			description: 'Creates new booking slots for a given branch',
			tags: ['Slots'],
			params: z.object({
				branchId: z.string()
			}),
			body: createSlotsSchema,
			response: {
				...authenticatedFrameworkResponses,
				201: z
					.object({
						branchId: z.string(),
						name: z.string()
					})
			}
		},

		handler: async (request, reply) => {
			try {

				await createSlots(request.body, request.params.branchId);

				return reply.status(201).send();
			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}