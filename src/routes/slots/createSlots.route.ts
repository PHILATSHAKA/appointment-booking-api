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
						message: z.string()
					}),
				422: z.object({
					error: z.string(),
					message: z.string()
				})
			}
		},

		handler: async (request, reply) => {
			try {

				const response = await createSlots(request.body, request.params.branchId);

				if ('error' in response && response.error === 'BranchNotFound') {
					return reply.status(422).send(response);
				}

				return reply.status(201).send({
					message: `Successfully created: ${response.created} slots.`
				});

			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}