import { Kafka } from 'kafkajs';
import { createBookingSchema } from '#services/bookings/createBooking.js';
import { z } from 'zod';

let producer: ReturnType<Kafka['producer']> | null = null;

export const createBookingKafkaSchema = createBookingSchema.extend({
	slotId: z.string().uuid().describe('The Id of the slot being booked'),
	status: z.literal('CONFIRMED').describe('The status of the booking, always CONFIRMED on creation'),
	bookingId: z.string().uuid().describe('The unique Id of the booking'),
	createdAt: z.string().describe('Timestamp when the booking was created'),
	updatedAt: z.string().describe('Timestamp when the booking was last updated')
});

export type CreateBookingKafkaSchema = z.infer<typeof createBookingKafkaSchema>;

/**
 *
 */
export async function initKafka() {
	const kafka = new Kafka({ brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(',') });
	producer = kafka.producer();
	await producer.connect();
}

/**
 *
 * @param booking
 */
export async function publishBookingCreated(booking: CreateBookingKafkaSchema) {
	if (!producer) {
		return;
	}
	await producer.send({
		topic: 'booking_created_dev', // TODO: Move to env variable
		messages: [{ key: booking.bookingId, value: JSON.stringify(booking) }]
	});
}

/**
 *
 */
export async function closeKafka() {
	if (producer) {
		await producer.disconnect();
	}
}