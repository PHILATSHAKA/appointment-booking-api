import { dbConnectionPool } from '#resources/infra/config.js';
import { getBranchByIdSchemaResponse } from './getBranchById.js';
import { z } from 'zod';

export const getBranchesSchemaResponse = getBranchByIdSchemaResponse.extend({
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date()
});

type GetBranchesSchemaResponse = z.infer<typeof getBranchesSchemaResponse>

/**
 * Retrieve a list of all branches, ordered by creation date.
 *
 * This function fetches all branch records from the database
 * and returns them in descending order of `created_at`, meaning
 * the most recently created branches appear first.
 *
 * - Returns full branch objects (id, name, address, timezone, created_at, updated_at).
 * - For consistency, it’s recommended to select explicit columns instead of `SELECT *`,
 *   so the return type is predictable.
 *
 * @param search - The search value
 * @returns {Promise<Array<GetBranchesSchemaResponse>>} - Resolves with an array of branch records.
 *
 * @throws {Error} If the database query fails.
 */
export async function getListOfBranches(search?: string) {
	const { rows } = await dbConnectionPool.query<GetBranchesSchemaResponse>({
		name: 'get_l_of_branches',
		text: `
			SELECT
				id AS "branchId",
				name,
				address,
				timezone,
				created_at AS "createdAt",
				updated_at AS "updatedAt"
			FROM branches
			WHERE
				$1::text IS NULL
				OR name ILIKE '%' || $1::text || '%'
				OR address ILIKE '%' || $1::text || '%'
				OR province::text ILIKE '%' || $1::text || '%'
			ORDER BY name ASC;
		`,
		values: [search]
	});

	return rows;
}