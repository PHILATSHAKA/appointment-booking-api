import { Kafka } from 'kafkajs';

let producer: ReturnType<Kafka['producer']> | null = null;

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
export async function publishBookingCreated(booking: any) {
	if (!producer) {
		return;
	}
	await producer.send({
		topic: 'booking.created',
		messages: [{ key: booking.id, value: JSON.stringify(booking) }]
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