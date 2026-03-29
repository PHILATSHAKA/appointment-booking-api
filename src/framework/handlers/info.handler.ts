import { FastifyZodInstance } from '#framework/types.js';
import { getInfo } from '#utils/serviceInfo.js';

// ------------------------
// IMPORT ENDPOINT HANDLERS
// ------------------------

/**
 * Registers routes on an server.
 * 
 * @param server Server on which to register routes.
 */
export default async (server: FastifyZodInstance) => { // eslint-disable-line require-await

	// Get runtime information.
	server.route({
		method: 'GET',
		url: '/info',
		schema: {
			tags: ['Framework'],
			summary: 'Service info',
			hide: true
		},
		handler: (_request, reply) => reply.status(200).send(getInfo())
	});
};

export const prefixOverride = '';