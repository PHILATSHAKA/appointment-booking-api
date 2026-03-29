import { z } from 'zod';

import { FastifyZodTypeProvider } from '#src/global.js';
import { authenticatedFrameworkResponses } from '#framework/types.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';

import { getBranchesSchemaResponse, getListOfBranches } from '#services/branch/getListOfBranches.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: getBranchesRoute.name });

/**
 * Get list of branches route.
 * @param server Fastify server instance.
 */
export default function getBranchesRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'GET',
		url: '/branches',
		schema: {
			summary: 'Get branches',
			description: 'Get a list branches',
			tags: ['Branches'],
			querystring: z.object({
				search: z.string().nullish().transform((value) => value ?? undefined)
			}),
			response: {
				...authenticatedFrameworkResponses,
				200: getBranchesSchemaResponse.array(),
				204: z.void()
			}
		},
		handler: async (request, reply) => {
			try {

				const response = await getListOfBranches(request.query.search);
				return reply.status(200).send(response);
			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}