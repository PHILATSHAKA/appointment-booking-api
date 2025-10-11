import type { FastifyBaseLogger, FastifyInstance, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from 'fastify';
import type { EnvironmentVariables } from '#framework/configuration.ts';
import type { Roles } from '#types/common.schema.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

declare global {
	namespace NodeJS {
		interface ProcessEnv extends EnvironmentVariables {} // eslint-disable-line @typescript-eslint/no-empty-object-type
	}
}

// Define type indicative that zod is the type provider on the fastify server instance.
export type FastifyZodTypeProvider = FastifyInstance<RawServerDefault, RawRequestDefaultExpression<RawServerDefault>, RawReplyDefaultExpression<RawServerDefault>, FastifyBaseLogger, ZodTypeProvider>;

/**
 * See {@link https://fastify.dev/docs/latest/Reference/TypeScript#plugins}
 * Using declaration merging, add your plugin properties to the appropriate fastify interfaces.
 * If property type is defined here, the value will be type-checked when you call decorate{Request,Reply}
 */

declare module 'fastify' {
	interface FastifyRequest {
		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		decodedToken: Jwt | null;

		// Populated by the authorization pre-handler, only applies to requests in authenticated endpoints.
		tokenString: string | null;

		roles: Roles[];
		groups: string[];
	}

	interface FastifyContextConfig {
		roles?: Roles[];
	}
}

/**
 * See {@link https://github.com/fastify/fastify-request-context#typescript fastify request context}
 */
declare module '@fastify/request-context' {
	interface RequestContextData {
		correlationId: string;
	}
}

declare module 'dayjs' {
  interface Dayjs {
    tz(timezone: string): dayjs.Dayjs;
    tz(timezone: string, keepLocalTime: boolean): dayjs.Dayjs;
  }

  function tz(input: string, timezone: string): dayjs.Dayjs;
  function tz(
    input: string,
    format: string,
    timezone: string
  ): dayjs.Dayjs;
}