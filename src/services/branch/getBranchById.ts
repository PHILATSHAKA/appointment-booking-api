import { dbConnectionPool } from '#resources/infra/config.js';
import { z } from 'zod';

export const getBranchByIdSchemaResponse = z.object({
	branchId: z.string(),
	name: z.string(),
	address: z.string(),
	timezone: z.string()
});

type GetBranchByIdSchemaResponse = z.infer<typeof getBranchByIdSchemaResponse>

/**
 *Retrieve a branch by its ID.
 *
 * This function fetches a single branch record from the database
 * using its unique UUID. If no branch is found, it returns `null`.
 *
 * - Only returns selected fields: `branchId`, `name`, `address`, `timezone`.
 * - Ensures the provided ID is a valid UUID before querying the database.
 *
 * @param {string} branchId - UUID of the branch to fetch.
 *
 * @returns {Promise<{
 *   branchId: string,
 *   name: string,
 *   address: string,
 *   timezone: string
 * } | null>} - Resolves with the branch record if found, otherwise `null`.
 *
 * @throws {Error} If the `branchId` is not a valid UUID or if a database error occurs.
 */
export async function getBranchById(branchId: string) {
	const { rows } = await dbConnectionPool.query<GetBranchByIdSchemaResponse>({
		name: 'get_br_by_id',
		text: `
			SELECT name, address, timezone, id AS "branchId"
			FROM branches
			WHERE id=$1
		`,
		values: [branchId]
	});

	if (rows.length === 0) {
		return;
	}

	return rows[0];
}