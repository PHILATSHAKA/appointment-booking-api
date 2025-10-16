import { baseLogger } from '#src/utils/logger.js';
import { basename } from 'path';
import { dbConnectionPool } from '#resources/infra/config.js';
import { env } from '#framework/configuration.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: expireBookingsJob.name });

/**
 * Background job that expires outdated bookings.
 *
 * This function:
 *  - Finds all bookings with status = 'CONFIRMED' where the slot has already ended.
 *  - Updates their status to 'EXPIRED' in the database.
 *  - Simulates an event to Kafka so dependent systems (e.g., admin dashboards) are notified.
 *
 */
export async function expireBookingsJob() {

	logger.warn(`[expireBookingsJob] Started at ${new Date().toISOString()}`);

	try {
		const { rowCount, rows } = await dbConnectionPool.query({
			name: 'upd_exp_bookings',
			text: `
			UPDATE bookings
			SET status = 'EXPIRED',
				updated_at = NOW()
			WHERE status = 'CONFIRMED'
				AND slot_id IN (
				SELECT id FROM slots WHERE end_time < NOW()
				)
			RETURNING id, slot_id, customer_email, updated_at;
		`
		});

		logger.warn(`[expireBookingsJob] Expired ${rowCount} bookings.`);

		for (const row of rows) {
			const kafkaPayload = {
				topic: 'booking-status-updates',
				messages: [
					{
						key: row.id,
						value: JSON.stringify({
							eventType: 'BOOKING_EXPIRED',
							bookingId: row.id,
							slotId: row.slot_id,
							customerEmail: row.customer_email,
							newStatus: 'EXPIRED',
							expiredAt: row.updated_at
						})
					}
				]
			};
			logger.info({ kafkaPayload });
		}

	} catch (error) {
		logger.error({ error }, '[expireBookingsJob] Failed:');
	}

}

/**
 * Starts the recurring worker that periodically calls `expireBookingsJob`.
 *
 * Uses `setInterval` to run the job every 5 minutes.
 * This is suitable for this MVP, but can later be replaced with a Kubernetes CronJob for more reliability.
 *
 */
export function startExpireBookingsWorker() {
	// Run every 5 minutes (300,000 ms)
	setInterval(expireBookingsJob, env.EXPIRE_BOOKINGS_INTERVAL_MS);
}
