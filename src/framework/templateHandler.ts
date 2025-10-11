import { FastifyZodInstance, frameworkResponses, validationResponses } from '#framework/types.js';
import { baseLogger, getHandlerLogContext } from '#utils/logger.js';
import { z } from 'zod';

const logger = baseLogger.child({ filePath: import.meta.url });

/**
 * Registers route on server.
 *
 * @param server Server on which to register route.
 */
export default async (server: FastifyZodInstance) => { // eslint-disable-line require-await

	server.route({
		method: 'GET',
		url: '/example',
		schema: {
			tags: ['Example'],
			summary: 'Example',
			description: 'An example route definition and handler.',
			// headers: z.object({}),
			// params: z.object({}),
			// querystring: z.object({}),
			// body: z.object({}),
			response: {
				...frameworkResponses,
				...validationResponses,
				200: z.object({
					message: z.string()
				}),
				204: z.void()
			}
		},
		handler: async (request, reply) => { // eslint-disable-line require-await

			try {

				if (Math.random() < 0.5) {
					return reply.status(204).send();
				}

				return reply.status(200).send({
					message: 'Hello, World!'
				});

			} catch (error) {

				logger.error({
					...getHandlerLogContext(request),
					error: error
				}, 'UNHANDLED');
				return reply.status(500).send();
			}
		}
	});
};

export const prefixOverride = '';