import { AppError } from '#errors/appError.js';

import { baseLogger } from './logger.js';
import { basename } from 'path';

const logger = baseLogger.child({ fileName: basename(import.meta.url), functionName: fgaWrapper.name });

type fgaWrapperAction = {
	// Name of the FGA operation, e.g. "check", "write", "expand"
	action: string;
};

/**
 * Wraps any OpenFGA client operation with consistent error handling.
 * Throws a `HttpApiError` with detailed metadata for Fastify to process/log.
 *
 * @template T The return type of the FGA operation
 * @param fn A function that returns an FGA client promise
 * @param fgaOperation
 * @returns The result of the FGA operation
 */
export async function fgaWrapper<T>(fn: () => Promise<T>, fgaOperation: fgaWrapperAction): Promise<T> {
	try {
		return await fn();
	} catch (error: any) {
		logger.error(
			{
				error: error,
				action: fgaOperation.action
			},
			'OpenFGA error'
		);

		const status = error.statusCode || 500;

		// Treat all known OpenFGA errors as internal server error, because these are not the client issues.
		if ([400, 401, 403, 409].includes(status)) {
			throw new AppError(500, `OpenFGA failed during [${fgaOperation.action}]`, {
				reason: error?.apiErrorMessage || error?.message,
				endpoint: error?.endpointCategory,
				method: error.method,
				code: status
			});
		}

		// Treat all 5xx from OpenFGA as downstream failure
		if (status >= 500) {
			throw new AppError(502, `OpenFGA unavailable during [${fgaOperation.action}]`, {
				error: error?.message,
				endpoint: error?.endpointCategory
			});
		}

		// Catch-all fallback
		throw new AppError(500, `Unknown OpenFGA error during ${fgaOperation.action}`, {
			originalMessage: error?.message
		});
	}
}