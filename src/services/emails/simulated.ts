import { dbConnectionPool } from '#resources/infra/config.js';

/**
 *
 * @param to
 * @param subject
 * @param body
 */
export async function SendSimulatedEmail(to: string, subject: string, body: string) {
	try {
		await dbConnectionPool.query(
			`
			INSERT INTO simulated_emails(to_email, subject, body) VALUES($1,$2,$3)
			`,
			[to, subject, body]
		);
	} catch (error) {
		console.error(error);
	}

}