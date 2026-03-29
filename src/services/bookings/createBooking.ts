import { z } from 'zod';

import { baseLogger } from '#src/utils/logger.js';
import { basename } from 'path';
import { dbConnectionPool } from '#resources/infra/config.js';
import { handlePostgresError } from '#errors/postgresError.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: createBooking.name });

export const createBookingSchema = z.object({
	branchId: z.string().uuid().describe('The Id of the branch where the booking is made'),
	slotDate: z.string().refine(s => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }).describe('Date of the slot for the booking in YYYY-MM-DD format'),
	slotTime: z
		.string().refine(
			(value) => !isNaN(Date.parse(value)),
			{ message: 'Invalid date-time format. Must be a valid ISO 8601 string.' }
		).describe('Time of the slot for the booking'),
	customerName: z.string().trim().min(1).max(50).regex(/^(?!.*\d)(?!^[^a-zA-Z]*$).*$/, {
		message: 'The customer name must not contain any numbers and must contain at least one letter.'
	}).describe('The full name of the customer for the booking'),
	customerEmail: z.string().email().describe('Email of the customer for the booking'),
	serviceType: z.string().min(1).max(100).describe('Type of service for the booking (e.g., credit, save)'),
	meta: z.record(z.any(), z.any()).optional().describe('Optional meta field for additional customer info (e.g., phone number)')
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
 * - The `meta` field stores additional customer info as JSON (e.g., customer phone number).
 *
 * @param {CreateBookingInput} input - Booking input data
 *
 * @param {string} slotId - UUID of the slot to book.
 * @returns {Promise<{bookingId: string} | null>} - Resolves with the created booking record, or `null` if the slot does not exist.
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
		const result = await client.query<{bookingId: string, createdAt: string, updatedAt: string, status: string}>({
			name: 'ins_booking',
			text: `
				INSERT INTO bookings (slot_id, customer_email, customer_name, service_type, status, meta)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING id AS "bookingId", created_at AS "createAt", updated_at AS "updateAt", status
			`,
			values: [slotId, input.customerEmail, input.customerName, input.serviceType, 'CONFIRMED', input.meta ?? null]
		});

		await client.query('COMMIT');

		const { status, bookingId, createdAt, updatedAt } = result.rows[0];
		const kafkaPayload = {
			...input,
			slotId,
			status,
			bookingId,
			createdAt,
			updatedAt
		};

		// Produce to Kafka topic
		logger.info({ kafkaPayload }, 'Booking kafka payload');

		return { bookingId };

	} catch (error) {
		await client.query('ROLLBACK');
		handlePostgresError(error, createBooking.name);
	} finally {
		client.release();
	}

}