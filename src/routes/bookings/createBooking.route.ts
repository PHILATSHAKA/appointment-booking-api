import { AppError } from '#errors/appError.js';
import { FastifyZodTypeProvider } from '#src/global.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';
import { z } from 'zod';

import { createBooking, createBookingSchema } from '#services/bookings/createBooking.js';

import { authenticatedFrameworkResponses } from '#framework/types.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: createBookingRoute.name });

/**
 * Create booking.
 * @param server Fastify server instance.
 */
export default function createBookingRoute(server: FastifyZodTypeProvider) {
	server.route({
		method: 'POST',
		url: '/bookings/slots/:slotId',
		schema: {
			summary: 'Create bookings',
			description: 'Creates a new booking under the specified slot ID',
			tags: ['Bookings'],
			body: createBookingSchema,
			params: z.object({
				slotId: z.string().uuid()
			}),
			response: {
				...authenticatedFrameworkResponses,
				201: z
					.object({
						bookingId: z.string()
					})
			}
		},
		handler: async (request, reply) => {
			try {

				const booking = await createBooking(request.body, request.params.slotId);

				// Slot not found
				if (!booking) {
					return reply.status(204).send();
				}

				return reply.status(201).send(booking);
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