import { bookingStatus } from './updateBooking.js';
import { dbConnectionPool } from '#resources/infra/config.js';
import { z } from 'zod';

export const getBookingByIdSchemaResponse = z.object({
	bookingId: z.string(),
	slotId: z.string(),
	customerEmail: z.string(),
	customerName: z.string(),
	serviceType: z.string(),
	status: bookingStatus,
	createdAt: z.string(),
	updatedAt: z.string(),
	meta: z.record(z.unknown(), z.string().or(z.boolean().nullish().transform((value) => value ?? undefined)))
});

type GetBookingByIdSchemaResponse = z.infer<typeof getBookingByIdSchemaResponse>

/**
 *
 * Retrieve a booking by its ID.
 *
 * This function fetches a single booking record from the database
 * by its unique UUID. If no booking exists for the given ID, it returns `null`.
 *
 * - Validates that the `bookingId` is a UUID before querying.
 * - Returns the complete booking row (id, slot_id, customer info, status, timestamps).
 *
 * @param {string} bookingId - UUID of the booking to fetch.
 *
 * @returns {Promise< GetBookingByIdSchemaResponse | undefined>} - Resolves with the booking record if found, otherwise `undefined`.
 *
 * @throws {Error} If the `bookingId` is not a valid UUID or if a database error occurs.
 */
export async function getBooking(bookingId: string) {

	const { rows } = await dbConnectionPool.query<GetBookingByIdSchemaResponse>({
		name: 'get_booking',
		text: `
			SELECT
			b.id AS "bookingId",
			b.slot_id AS "slotId",
			b.customer_email AS "customerEmail",
			b.customer_name AS "customerName",
			b.service_type AS "serviceType",
			b.meta,
			b.status,
			b.created_at AS "createdAt",
			b.updated_at AS "updateAt"
			FROM bookings b
			WHERE id=$1
		`,
		values: [bookingId]

	});

	if (rows.length === 0) {
		return;
	}

	return rows[0];
}