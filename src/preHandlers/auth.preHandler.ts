import { FastifyReply, FastifyRequest } from 'fastify';
import { getHttpAuthFromHeaderValue, validateToken, validateTokenRoles } from '#utils/auth.js';
import { ForbiddenError } from '#errors/ForbiddenError.js';
import { baseLogger } from '#utils/logger.js';
import { basename } from 'path';
import { env } from '#framework/configuration.js';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: authPreHandler.name });

/**
 * Pre-handler to authenticate requests.
 *
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 * @returns The Fastify done callback.
 */
export async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
	try {
		// Check for authorization header.
		if (!request.headers.authorization) {
			logger.error('No authorization header provided.');
			return reply.status(401).send();
		}

		// Extract token from authorization header.
		request.tokenString = getHttpAuthFromHeaderValue(request.headers.authorization, 'Bearer');

		try {
			// Validate token and decode it.
			const token = await validateToken(
				request.tokenString,
				env.TRUSTED_CLIENT_ISSUER,
				env.TRUSTED_CLIENT_JWKS_URI,
				// jsonwebtoken expects a non-empty tuple ([string, ...string[]]) for allowed audiences,
				// but env.TRUSTED_CLIENT_ALLOWED_AUDIENCES is a plain array (string[]).
				// We cast it to satisfy TypeScript, or pass undefined if the array is empty.
				env.TRUSTED_CLIENT_ALLOWED_AUDIENCES.length > 0
					? (env.TRUSTED_CLIENT_ALLOWED_AUDIENCES as [string, ...string[]])
					: undefined
			);

			request.decodedToken = token; // eslint-disable-line require-atomic-updates
			request.roles = request.decodedToken?.payload.roles;
			request.groups = request.decodedToken?.payload.groups;

			// Check if token roles are required and validate them.
			if (request.routeOptions.config.roles) {
				validateTokenRoles(request.roles!, request.routeOptions.config.roles);
			}
		} catch (error) {
			if (error instanceof ForbiddenError) {
				logger.error({ error: error });
				return reply.status(403).send();
			}

			logger.error({ error: error });
			return reply.status(401).send();
		}
	} catch (error) {
		logger.error({ error: error });
		return reply.status(401).send();
	}
}