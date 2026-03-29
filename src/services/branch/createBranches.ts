import { dbConnectionPool } from '#resources/infra/config.js';
import { handlePostgresError } from '#errors/postgresError.js';
import { z } from 'zod';

export const createBranchSchema = z.object({
	name: z.string(),
	address: z.string(),
	province: z.enum([
		'EASTERN CAPE',
		'FREE STATE',
		'GAUTENG',
		'KWAZULU-NATAL',
		'LIMPOPO',
		'MPUMALANGA',
		'NORTHERN CAPE',
		'NORTH WEST',
		'WESTERN CAPE'
	]),
	timezone: z.string().default('Africa/Johannesburg')
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

/**
 *
 * Create a new branch in the system.
 *
 * This function inserts a new branch record into the database
 * with the given name, address, and timezone. It ensures that the
 * input data is valid before executing the insert query.
 *
 * - Branch `name` + `address` combination is unique at the DB level.
 * - The `timezone` field is stored as text and expected to be a valid IANA timezone string.
 * - Returns the full branch record after insertion.
 *
 * @param {CreateBranchInput[]} branches - The branch data object:
 *   - `name` {string} — Name of the branch.
 *   - `address` {string} — Address of the branch.
 *   - `timezone` {string} — IANA timezone identifier (e.g., "Africa/Johannesburg").
 *
 * @returns {Promise<{
 *   branchId: string
 * }[]>} - Resolves with the created branch record.
 *
 * @throws {Error} If validation fails or the database insert fails.
 *
 */
export async function createBranches(branches: CreateBranchInput[]) {

	// Build parameterized query for multiple inserts
	const values: any[] = [];
	const placeholders: string[] = [];
	const client = await dbConnectionPool.connect();

	try {

		branches.forEach((branch, i) => {
			const index = i * 4;
			placeholders.push(`($${index + 1}, $${index + 2}, $${index + 3}, $${index + 4})`);
			values.push(branch.name, branch.address, branch.province, branch.timezone);
		});

		// Start transaction
		await client.query('BEGIN');

		const result = await dbConnectionPool.query<{branchId: string, name: string}>({
			name: 'ins_branches',
			text: `
			INSERT INTO branches (name, address, province, timezone)
			VALUES ${placeholders.join(', ')}
			ON CONFLICT (name, address) DO NOTHING
			RETURNING id AS "branchId", name`,
			values: values
		});

		await client.query('COMMIT');

		return result.rows;
	} catch (error) {
		await client.query('ROLLBACK');
		handlePostgresError(error, createBranches.name);

	} finally {
		client.release();
	}
}