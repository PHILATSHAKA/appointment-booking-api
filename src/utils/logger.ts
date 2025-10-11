import { type FastifyRequest } from 'fastify';
import { basename } from 'path';
import { env } from 'process';
import instana from '@instana/collector';
import packageJson from '../../package.json' with { type: 'json' };
import { pino } from 'pino';
import { requestContext } from '@fastify/request-context';

export const baseLogger = pino({
	level: env.SERVICE_LOG_LEVEL || 'warn',
	formatters: {
		log(object) {

			return {
				serviceName: packageJson.name,
				correlationId: requestContext.get('correlationId') ?? '',
				// explicitly set to undefined when nullish to avoid being included in parsed JSON log entry
				instanaTraceId: instana.currentSpan().span?.t ?? undefined,
				...object
			};
		},
		level(label) {
			return { level: label };
		}
	},
	timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
	redact: {
		paths: ['error.stack', 'error.config', 'headers.authorization'],
		remove: true
	},
	messageKey: 'message',
	errorKey: 'error',
	onChild: child => {

		// Get the child logger supplied bindings.
		const bindings = child.bindings();

		// Automatically add the name of the file in which the log entry was made from when the file path is provided.
		if (bindings.filePath && !bindings.fileName) {

			child.setBindings({
				fileName: basename(bindings.filePath)
			});
		}
	}
});

/**
 * Get detail to include in log entries made by a request handler.
 * 
 * @param request - The request being served.
 * @returns The detail to include in log entries made by a request handler.
 */
export function getHandlerLogContext(request: FastifyRequest) {

	return {
		request: {
			url: request.url,
			method: request.method,
			pathTemplate: `${request.routeOptions.method}.${request.routeOptions.url}`
		}
	};
}