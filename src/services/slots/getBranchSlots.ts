import dayjs from 'dayjs';
import { dbConnectionPool } from '#resources/infra/config.js';
import { handlePostgresError } from '#errors/postgresError.js';
import { z } from 'zod';

export const dateSchema = z.string().refine(
	(value) => dayjs(value, 'YYYY-MM-DD', true).isValid(),
	{ message: 'Date must be in YYYY-MM-DD format' }
);

type DateSchema = z.infer<typeof dateSchema>

export const getBranchSlotsSchema = z.object({
	id: z.string().uuid(),
	branchId: z.string().uuid(),

	// UTC timestamps from DB
	startTimeUtc: z.coerce.date(),
	endTimeUtc: z.coerce.date(),

	// Local timezone formatted strings with offset (+02:00 for Africa/Johannesburg)
	startTimeLocal: z.string().datetime({ offset: true }),
	endTimeLocal: z.string().datetime({ offset: true }),

	// Availability flag
	isAvailable: z.boolean()
});

type GetBranchSlotsSchema = z.infer<typeof getBranchSlotsSchema>

/**
 * Retrieve all slots for a given branch on a specific date, 
 * including availability information.
 *
 * A slot is considered "available" if:
 * - There is no booking for that slot, OR
 * - The booking exists but has a status of 'CANCELLED'.
 *
 * @param {string} branchId - UUID of the branch to fetch slots for.
 * @param {string} date - The date (YYYY-MM-DD) to fetch slots for.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   branch_id: string,
 *   start_time: string,
 *   end_time: string,
 *   is_available: boolean
 * }>>} - Resolves with an array of slots for that branch and date.
 *
 * @throws {Error} Logs and rethrows if database query fails.
 */
export async function getBranchSlots(branchId: string, date: DateSchema) {

	try {
		const startOfDay = dayjs(date).startOf('day').toISOString();
		const endOfDay = dayjs(date).endOf('day').toISOString();

		const { rows } = await dbConnectionPool.query<GetBranchSlotsSchema>({
			name: 'get_branch_slots_sa',
			text: `
				SELECT
					s.id,
					s.branch_id AS "branchId",

					-- UTC values (timestamptz stored in DB, returned to JS as Date objects)
					s.start_time AS "startTimeUtc",
					s.end_time   AS "endTimeUtc",

					-- Local values formatted as strict ISO8601 string with fixed +02:00 offset
					-- Converts from UTC to Africa/Johannesburg and formats as text
					TO_CHAR(
					s.start_time AT TIME ZONE 'Africa/Johannesburg',
					'YYYY-MM-DD"T"HH24:MI:SS"+02:00"'
					) AS "startTimeLocal",
					TO_CHAR(
					s.end_time AT TIME ZONE 'Africa/Johannesburg',
					'YYYY-MM-DD"T"HH24:MI:SS"+02:00"'
					) AS "endTimeLocal",

					-- Availability check
					CASE
						-- If slot start time in local SA time is in the past or now → unavailable
						WHEN (s.start_time AT TIME ZONE 'Africa/Johannesburg')
							<= (NOW() AT TIME ZONE 'Africa/Johannesburg')
							THEN false

						-- If no booking exists → available
						WHEN b.id IS NULL
							THEN true

						-- Otherwise → booked (not available)
						ELSE false
					END AS "isAvailable"

				FROM slots s
				-- Join with bookings to see if the slot has a valid booking
				LEFT JOIN bookings b
				ON s.id = b.slot_id
				AND b.status != 'CANCELLED' -- cancelled bookings don’t block a slot

				-- Filter by branch (parameter $1)
				WHERE s.branch_id = $1

				-- Filter by time range (parameters $2 = startOfDay, $3 = endOfDay)
				AND s.start_time BETWEEN $2 AND $3

				-- Always order by slot start time
				ORDER BY s.start_time;
            `,
			values: [branchId, startOfDay, endOfDay]
		});

		return rows;

	} catch (error) {
		console.error(error);
		handlePostgresError(error, getBranchSlots.name);
	}
};
