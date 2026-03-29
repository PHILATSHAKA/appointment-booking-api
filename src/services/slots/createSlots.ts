// import dayjs from 'dayjs';

import dayjs from '#src/common/types/days-plugin.js';
import { dbConnectionPool } from '#resources/infra/config.js';
import { handlePostgresError } from '#errors/postgresError.js';
import { z } from 'zod';

export const createSlotsSchema = z.object({
	dateFrom: z.string(),
	dateTo: z.string(),
	slotMinutes: z.number(),
	workStart: z.string(),
	workEnd: z.string()
});

export type CreateSlotsInput = z.infer<typeof createSlotsSchema>;

/**
 *
 * Create appointment slots for a branch within a specified date range.
 *
 * This function generates slots for each day in the provided range,
 * dividing the working hours into fixed-length intervals (e.g., 30 min).
 * The slots are bulk-inserted into the database in a single transaction
 * to improve performance and ensure atomicity.
 *
 * - If the same slot (branch_id + start_time + end_time) already exists,
 *   the `ON CONFLICT DO NOTHING` clause prevents duplicates.
 * - The function is idempotent: running it multiple times with the same input
 *   will not create duplicate slots.
 * - A transaction ensures that either all slots are created, or none
 *   (rollback on error).
 *
 * @param {CreateSlotsInput} slot - Input object containing slot generation parameters
 *
 * @param {string} branchId - UUID of the branch for which slots are being created.
 *
 *
 * @throws {Error} If any error occurs during slot creation, the transaction is rolled back
 *   and the error is propagated.
 *
 */
export async function createSlots(slot: CreateSlotsInput, branchId: string) {
	// Parse date range from input
	const startDate = dayjs(slot.dateFrom);
	const endDate = dayjs(slot.dateTo);

	// Collect values for bulk insert
	const values: any[] = [];
	const placeholders: string[] = [];
	let paramIndex = 1;

	const { rows } = await dbConnectionPool.query({
		name: 'validate_branch_id',
		text: `
			SELECT id
			FROM branches
			WHERE id=$1
			`,
		values: [branchId]
	});

	if (rows.length === 0) {

		return {
			error: 'BranchNotFound',
			message: `No branch exists with the ID ${branchId}`
		};
	}

	  // Loop through each day in range
	for (let d = startDate; d.isBefore(endDate) || d.isSame(endDate, 'day'); d = d.add(1, 'day')) {

		// Anchor workday start/end in Africa/Johannesburg
		const workStartTime = dayjs.tz(`${d.format('YYYY-MM-DD')}T${slot.workStart}`, 'Africa/Johannesburg');
		const workEndTime = dayjs.tz(`${d.format('YYYY-MM-DD')}T${slot.workEnd}`, 'Africa/Johannesburg');

		 // Generate slots of slotMinutes length
		for (let t = workStartTime; t.isBefore(workEndTime); t = t.add(slot.slotMinutes, 'minute')) {
			const start = t.toISOString();
			const end = t.add(slot.slotMinutes, 'minute').toISOString();

			// Add parameterized values
			values.push(branchId, start, end);
			placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
			paramIndex += 3;
		}
	}

	if (values.length === 0) {
		return { created: 0 }; // nothing to insert
	}

	// Build the bulk insert query
	const query = `
		INSERT INTO slots (branch_id, start_time, end_time)
		VALUES ${placeholders.join(', ')}
		ON CONFLICT DO NOTHING
	`;

	const client = await dbConnectionPool.connect();

	try {

		await client.query('BEGIN');

		const result = await client.query(query, values);

		await client.query('COMMIT');

		return { created: result.rowCount };
	} catch (error) {
		await client.query('ROLLBACK');
		handlePostgresError(error, createSlots.name);
	} finally {
		client.release();
	}
}