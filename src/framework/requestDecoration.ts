import { FastifyZodInstance } from '#framework/types.js';

/**
 * See {@link https://github.com/fastify/fastify-request-context#typescript fastify request context}
 */
declare module '@fastify/request-context' {
	interface RequestContextData {
		correlationId: string
	}
}

/**
 * Decorate the request object with properties that are used by the application.
 * {@link https://fastify.dev/docs/v4.28.x/Reference/Decorators}
 * @param _server  - The fastify server instance on which to apply the decoration.
 * 
 */
export function decorateRequest(_server: FastifyZodInstance) { // eslint-disable-line @typescript-eslint/no-unused-vars
	// N/A
}

/**
 * See {@link https://fastify.dev/docs/latest/Reference/TypeScript#plugins}
 * Using declaration merging, add your plugin properties to the appropriate fastify interfaces.
 * If property type is defined here, the value will be type-checked when you call decorate{Request,Reply}
 */
/* EXAMPLE of properties expected to be populated on request object.
declare module 'fastify' {
	interface FastifyRequest {

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		decodedToken: Jwt | null

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		tokenString: string | null,

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		cardAcceptorId: string | null,

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		merchantId: string | null,

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		deviceId: string | null,

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		terminalId: string | null,

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		deviceSerialNumber: string | null,

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		username: string | null
	}
}
 */