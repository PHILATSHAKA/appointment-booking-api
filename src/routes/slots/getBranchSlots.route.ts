import { z } from 'zod';

import { dateSchema, getBranchSlots, getBranchSlotsSchema } from '#services/slots/getBranchSlots.js';
import { FastifyZodTypeProvider } from '#src/global.js';
import { authenticatedFrameworkResponses } from '#framework/types.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: getBranchSlotsRoute.name });

/**
 * Get branch slots route.
 * @param server Fastify server instance.
 */
export default function getBranchSlotsRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'GET',
		url: '/branches/:branchId/slots',
		schema: {
			summary: 'Get branch slots',
			description: 'Get a branch slots',
			tags: ['Slots'],
			params: z.object({
				branchId: z.string().uuid()
			}),
			querystring: z.object({
				date: dateSchema
			}),
			response: {
				...authenticatedFrameworkResponses,
				200: getBranchSlotsSchema.array(),
				204: z.void()
			}
		},
		handler: async (request, reply) => {
			try {

				const response = await getBranchSlots(request.params.branchId, request.query.date);
				return reply.status(200).send(response);
			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}