import { AppError } from '#errors/appError.js';
import { FastifyZodTypeProvider } from '#src/global.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';
import { z } from 'zod';

import { bookingStatus, updateBooking } from '#services/bookings/updateBooking.js';
import { authenticatedFrameworkResponses } from '#framework/types.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: updateBookingRoute.name });

/**
 * Update booking route.
 * @param server Fastify server instance.
 */
export default function updateBookingRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'PATCH',
		url: '/bookings/:bookingId',
		schema: {
			summary: 'Update bookings',
			description: 'Update a booking',
			tags: ['Bookings'],
			body: z.object({
				status: z.enum(['CONFIRMED', 'CANCELLED'])
			}),
			params: z.object({
				bookingId: z.string().uuid()
			}),
			response: {
				...authenticatedFrameworkResponses,
				200: z
					.object({
						bookingId: z.string(),
						status: bookingStatus
					})
			}
		},
		handler: async (request, reply) => {
			try {

				const booking = await updateBooking(request.body, request.params.bookingId);

				// Slot not found
				if (!booking) {
					return reply.status(204).send();
				}

				if (booking.statusCode === 409) {
					return reply.status(409).send();
				}

				return reply.status(200).send({
					bookingId: booking.bookingId!,
					status: booking.status!
				});
			} catch (error) {

				logger.error({ error: error });

				if (error instanceof AppError && error.statusCode === 409) {
					return reply.status(409).send();
				}

				return reply.status(500).send();
			}
		}
	});
}