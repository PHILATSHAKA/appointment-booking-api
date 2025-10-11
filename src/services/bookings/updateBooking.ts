import { dbConnectionPool } from '#resources/infra/config.js';
import { handlePostgresError } from '#errors/postgresError.js';
import { z } from 'zod';

export const bookingStatus = z.enum(['CONFIRMED', 'CANCELLED']);
export const updateBookingSchema = z.object({
	status: bookingStatus
});

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

/**
 *  Update the status of an existing booking.
 *
 * This function:
 * - Starts a transaction and locks the booking row (`FOR UPDATE`) to prevent race conditions.
 * - Verifies the booking exists.
 * - Only allows status updates if the booking is currently in `PENDING` state, which in this flow it won't be the case.
 * - Commits the transaction after updating, or rolls back on error.
 *
 * - Returns `null` if the booking does not exist.
 * - Returns a 409-style response if the booking is in a non-updatable state.
 *
 * @param {UpdateBookingInput} input - Update payload:
 *   - `status` {"PENDING" | "CONFIRMED" | "CANCELLED"} — New status for the booking.
 *
 * @param {string} bookingId - UUID of the booking to update.
 *
 * @returns {Promise< { bookingId: string, status: "PENDING" | "CONFIRMED" | "CANCELLED" }
 *   | { bookingId: string, statusCode: 409, message: string }
 *   | undefined
 * >}
 *
 * - Updated booking info if successful.
 * - Conflict response if booking is not updatable.
 * - `undefined` if booking not found.
 *
 * @throws {Error} If validation fails or a database error occurs.
 */
export async function updateBooking({ status }: UpdateBookingInput, bookingId: string) {
	const client = await dbConnectionPool.connect();
	try {

		await client.query('BEGIN');

		// Lock the booking row for update
		const { rows } = await client.query({
			name: 'up_sel_booking',
			text: `
				SELECT * FROM bookings
				WHERE id=$1
				FOR UPDATE
			`,
			values: [bookingId]
		});

		if (rows.length === 0) {
			await client.query('ROLLBACK');
			return;
		}

		const booking = rows[0];

		// Only allow transition from PENDING → CONFIRMED or CANCELLED
		if (booking.status !== 'PENDING') {
			await client.query('ROLLBACK');
			return {
				bookingId: bookingId,
				statusCode: 409,
				message: 'Booking cannot be updated from current status'
			};
		}

		// Perform the update
		await client.query({
			name: 'update_booking',
			text: `
				UPDATE bookings
				SET status=$1,
				updated_at=NOW()
				WHERE id=$2
			`,
			values: [status, bookingId]
		});

		await client.query('COMMIT');

		return { bookingId, status };

	} catch (error: any) {
		await client.query('ROLLBACK');
		handlePostgresError(error, updateBooking.name);
	} finally {
		client.release();
	}

}