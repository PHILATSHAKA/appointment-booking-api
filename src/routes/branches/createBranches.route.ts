import { FastifyZodTypeProvider } from '#src/global.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';
import { z } from 'zod';

import { createBranchSchema, createBranches } from '#services/branch/createBranches.js';
import { authenticatedFrameworkResponses } from '#framework/types.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: createBranchesRoute.name });

/**
 * Create branch route.
 * @param server Fastify server instance.
 */
export default function createBranchesRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'POST',
		url: '/branches',
		schema: {
			summary: 'Create branch',
			description: 'Creates a new branch',
			tags: ['Branches'],
			body: createBranchSchema.array(),
			response: {
				...authenticatedFrameworkResponses,
				201: z
					.object({
						branchId: z.string(),
						name: z.string()
					}).array()
			}
		},
		handler: async (request, reply) => {
			try {

				const response = await createBranches(request.body);

				return reply.status(201).send(response);
			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}