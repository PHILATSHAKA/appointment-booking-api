import { dbConnectionPool } from '#resources/infra/config.js';
import { handlePostgresError } from '#errors/postgresError.js';
import { z } from 'zod';

export const createBookingSchema = z.object({
	branchId: z.string().uuid(),
	slotDate: z.string().refine(s => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }),
	slotTime: z.string(), // HH:MM:SS or HH:MM
	customerName: z.string().min(1),
	customerEmail: z.string().email(),
	serviceType: z.string(),
	meta: z.record(z.any(), z.any()).optional()
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Create a booking for a specific slot.
 *
 * This function:
 * 1. Starts a transaction to ensure atomicity.
 * 2. Verifies the slot exists.
 * 3. Inserts a booking for the given slot.
 * 4. Commits the transaction if successful, or rolls back on error.
 *
 * - If the slot does not exist, the transaction is rolled back and `null` is returned.
 * - The booking is immediately created with `CONFIRMED` status.
 * - The `meta` field stores additional customer info as JSON (e.g., customer name).
 *
 * @param {CreateBookingInput} input - Booking input data:
 *   - `customerEmail` {string} — Customer’s email address.
 *   - `customerName` {string} — Customer’s full name.
 *
 * @param {string} slotId - UUID of the slot to book.
 * @returns {Promise<{
 *   bookingId: string
 * } | null>} - Resolves with the created booking record, or `null` if the slot does not exist.
 *
 * @throws {Error} If the database transaction fails, the error is logged and re-thrown by `handlePostgresError`.
 */
export async function createBooking(input: CreateBookingInput, slotId: string) {
	const client = await dbConnectionPool.connect();

	try {
		await client.query('BEGIN');

		// Validate slot existence
		const slot = await client.query({
			name: 'get_slot',
			text: `
				SELECT id
				FROM slots
				WHERE id=$1
				`,
			values: [slotId]
		});

		if (slot.rows.length === 0) {
			await client.query('ROLLBACK');
			return;
		}

		// Create booking
		const result = await client.query<{bookingId: string}>({
			name: 'ins_booking',
			text: `
				INSERT INTO bookings (slot_id, customer_email, customer_name, service_type, status, meta)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING id AS "bookingId"
			`,
			values: [slotId, input.customerEmail, input.customerName, input.serviceType, 'CONFIRMED', input.meta ?? null]
		});

		await client.query('COMMIT');

		return result.rows[0];

	} catch (error: any) {
		await client.query('ROLLBACK');
		handlePostgresError(error, createBooking.name);
	} finally {
		client.release();
	}

}