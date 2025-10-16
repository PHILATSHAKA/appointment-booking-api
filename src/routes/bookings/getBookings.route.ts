import { FastifyZodTypeProvider } from '#src/global.js';
import { z } from 'zod';

import { authenticatedFrameworkResponses } from '#framework/types.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';

import { bookingsFilterSchema, getBookings, getBookingsSchemaResponse } from '#services/bookings/getBookings.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: getBookingsRoute.name });

/**
 * Get list of bookings route.
 * @param server Fastify server instance.
 */
export default function getBookingsRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'GET',
		url: '/bookings',
		schema: {
			summary: 'Get bookings',
			description: 'Returns list of bookings based on the provided filters.',
			tags: ['Bookings'],
			querystring: bookingsFilterSchema,
			response: {
				...authenticatedFrameworkResponses,
				200: getBookingsSchemaResponse.array(),
				204: z.void()
			}
		},
		handler: async (request, reply) => {
			try {

				const booking = await getBookings(request.query);

				return reply.status(200).send(booking);
			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}