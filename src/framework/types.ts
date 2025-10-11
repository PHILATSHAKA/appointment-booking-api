import type { FastifyBaseLogger, FastifyInstance, RawServerDefault } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// ---------------
// FRAMEWORK TYPES
// ---------------

export type FastifyZodInstance = FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, FastifyBaseLogger, ZodTypeProvider>

// -------------------
// FRAMEWORK RESPONSES
// -------------------

export const systemConflictMessageSchema = z.object({
	message: z.string().optional(),
	reasonCode: z.number().int()
});

const httpBadRequestSchema = z.object({
	message: z.string(),
	context: z.string().optional(),
	errors: z.object({
		message: z.string(),
		code: z.string(),
		path: z.union([z.string(), z.number()]).array()
	}).optional().array()
});

export const frameworkResponses = {
	500: z.void()
} as const;

export const validationResponses = {
	...frameworkResponses,
	400: httpBadRequestSchema.optional(),
	415: z.void()
} as const;

export const authenticatedFrameworkResponses = {
	...validationResponses,
	401: z.void(),
	403: z.void()
};

// Export route security schemes.
// Note: Cannot currently export these as reference type without breaking the generated API contract, thus exporting as functions instead.
export const securitySchemesNone = () => [];
export const securitySchemesBasic = () => [{ basicAuth: [] }];
export const securitySchemesBearer = () => [{ bearerAuth: [] }];