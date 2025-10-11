import { z } from 'zod';

import { getBooking, getBookingByIdSchemaResponse } from '#services/bookings/getBooking.js';
import { FastifyZodTypeProvider } from '#src/global.js';
import { authenticatedFrameworkResponses } from '#framework/types.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: getBookingRoute.name });

/**
 * Get a booking route.
 * @param server Fastify server instance.
 */
export default function getBookingRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'GET',
		url: '/bookings/:bookingId',
		schema: {
			summary: 'Get a booking',
			description: 'Returns a booking linked to a given booking ID',
			tags: ['Bookings'],
			params: z.object({
				bookingId: z.string().uuid()
			}),
			response: {
				...authenticatedFrameworkResponses,
				200: getBookingByIdSchemaResponse,
				204: z.void()
			}
		},
		handler: async (request, reply) => {
			try {

				const booking = await getBooking(request.params.bookingId);

				if (!booking) {
					return reply.status(204).send();
				}

				return reply.status(200).send(booking);
			} catch (error) {
				logger.error({ error: error });
				return reply.status(500).send();
			}
		}
	});
}