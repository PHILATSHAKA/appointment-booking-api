import { dbConnectionPool } from '#resources/infra/config.js';
import { getBookingByIdSchemaResponse } from './getBooking.js';
import { z } from 'zod';

type GetBookingsSchemaResponse = z.infer<typeof getBookingByIdSchemaResponse>

export const bookingsFilterSchema = z.object({
	status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).nullish().transform((value) => value ?? undefined),
	branchId: z.string().uuid().nullish().transform((value) => value ?? undefined),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().transform((value) => value ?? undefined),
	limit: z.number().int().min(1).max(100).nullish().transform((value) => value ?? undefined),
	offset: z.number().int().min(0).nullish().transform((value) => value ?? undefined)
});

type BookingsFilterSchema = z.infer<typeof bookingsFilterSchema>

/**
 * Generate a suffix for query names based on filters
 * @param base
 */
function generateQueryName(base: string, filters: { status?: string; branchId?: string; date?: string }) {
	const parts: string[] = [];

	if (filters.status) {
		parts.push('status');
	}
	if (filters.branchId) {
		parts.push('branch');
	}
	if (filters.date) {
		parts.push('date');
	}

	return parts.length > 0 ? `${base}_${parts.join('_')}` : base;
}

/**
 *
 * Retrieve all bookings.
 *
 * This function fetches all booking records from the database.
 * - Returns complete booking rows including slot, customer, status, and timestamps.
 * - Results are not filtered; if you need filtering (e.g. by branch, date, status),
 *   consider adding parameters later.
 *
 * @param query
 * @returns {Promise<Array<GetBookingsSchemaResponse>>} - Resolves with an array of booking records.
 *
 * @throws {Error} If the database query fails, the error will propagate
 * (handled by the global error handler or `handlePostgresError`).
 */
export async function getBookings(query: BookingsFilterSchema) {

	// Build WHERE clauses dynamically
	const whereClauses: string[] = [];
	const values: any[] = [];
	let paramIndex = 1;

	if (query.status) {
		whereClauses.push(`b.status = $${paramIndex++}`);
		values.push(query.status);
	}

	if (query.branchId) {
		whereClauses.push(`s.branch_id = $${paramIndex++}`);
		values.push(query.branchId);
	}

	if (query.date) {
		whereClauses.push(`s.start_time::date = $${paramIndex++}`);
		values.push(query.date);
	}

	// Pagination defaults
	const limit = query.limit ?? 50;
	const offset = query.offset ?? 0;

	const textQuery = `
		SELECT
			b.id,
			b.slot_id,
			b.customer_email,
			b.customer_name,
			b.service_type,
			b.meta,
			b.status,
			b.created_at,
			b.updated_at
		FROM bookings b
		JOIN slots s ON b.slot_id = s.id
		${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
		ORDER BY b.created_at DESC
		LIMIT $${paramIndex++} OFFSET $${paramIndex++}
	`;

	values.push(limit, offset);

	const queryName = generateQueryName('get_bookings', query);

	const { rows } = await dbConnectionPool.query<GetBookingsSchemaResponse>({
		name: queryName,
		text: textQuery,
		values: values
	});

	return rows;
}