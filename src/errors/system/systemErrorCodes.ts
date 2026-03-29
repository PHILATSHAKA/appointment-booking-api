import { z } from 'zod';

export const systemConflictMessageSchema = z.object({
	message: z.string(),
	reason: z.string(),
	reasonCode: z.number().int()
});

export const CUSTOMER_ACTIVE_BOOKING = {
	message: 'Customer already has an active booking',
	reason: 'customerHasActiveBooking',
	reasonCode: 0
};

export const SLOT_ALREADY_BOOKED = {
	message: 'Slot already booked.',
	reason: 'slotAlreadyBooked',
	reasonCode: 1
};

/**
 * Creates a schema for validating a system conflict error response object.
 *
 * This function takes a system conflict error response object and returns a object schema
 * that ensures the response contains the exact `message`, `reasonCode`, and `reason`
 * values as specified in the provided system conflict `error` object.
 *
 * @param error The system conflict error response object containing `message`, `reason`, and `reasonCode`.
 * @returns A schema that validates the provided error response structure.
 *
 * @example
 * const MERCHANT_REFERRED = {
 *   message: 'merchant has referred status in MAS',
 *   merchantReferredStatus',
 *   reasonCode: 2
 * };
 * const merchantReferred = createErrorSchema(MERCHANT_REFERRED);
 */
function createSystemConflictErrorSchema(error: z.infer<typeof systemConflictMessageSchema>) {
	return z.object({
		message: z.literal(error.message),
		reasonCode: z.literal(error.reasonCode),
		reason: z.literal(error.reason)
	});
}

export const customerHasActiveBooking = createSystemConflictErrorSchema(CUSTOMER_ACTIVE_BOOKING);
export const slotAlreadyTaken = createSystemConflictErrorSchema(SLOT_ALREADY_BOOKED);