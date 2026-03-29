import { z } from 'zod';

import { getBranchById, getBranchByIdSchemaResponse } from '#services/branch/getBranchById.js';
import { FastifyZodTypeProvider } from '#src/global.js';
import { authenticatedFrameworkResponses } from '#framework/types.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: getBranchesRoute.name });

/**
 * Get branch route.
 * @param server Fastify server instance.
 */
export default function getBranchesRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'GET',
		url: '/branches/:branchId',
		schema: {
			summary: 'Get branch',
			description: 'Get a branch by ID',
			tags: ['Branches'],
			params: z.object({
				branchId: z.string().uuid()
			}),
			response: {
				...authenticatedFrameworkResponses,
				200: getBranchByIdSchemaResponse,
				204: z.void()
			}
		},
		handler: async (request, reply) => {
			try {

				const response = await getBranchById(request.params.branchId);

				if (!response) {
					return reply.status(204).send();
				}

				return reply.status(200).send(response);
			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}