import { AxiosError } from 'axios';
import type { HttpApiResponse } from '#types/HttpApiResponse.js';
import { REQUEST_TIMED_OUT } from '#utils/httpRequest.js';
import { ZodError } from 'zod';

import { baseLogger } from '#utils/logger.js';
import path from 'path';
const logger = baseLogger.child({ fileName: path.basename(import.meta.url) });

const UNEXPECTED_RESPONSE = 'UNEXPECTED_RESPONSE';

/**
 * Base class for HTTP errors which encapsulates properties common across various HTTP failures.
 */
export class HttpApiError extends Error {

	// #region Properties

	apiName: string;

	method: string;

	response: HttpApiResponse | null;

	// #endregion

	// #region Constructors

	/**
	 * Initialize the error.
	 * 
	 * @param {string} message The error message.
	 * @param {string} apiName The error message.
	 * @param {string} method The error message.
	 * @param {HttpApiResponse|null} [response] The HTTP response object.
	 */
	constructor(message: string, apiName: string, method: string, response: HttpApiResponse | null = null) {

		super(message);

		this.name = 'HttpApiError';

		this.apiName = apiName;
		this.method = method;

		this.response = response;
	}
}

// #region Error handling

/**
 * Handles an error which occurred whilst retrieving data from the MAS API.
 * 
 * @param error Error to handle.
 * @param apiName Name of the service in which the error occurred.
 * @param functionName Name of the function in which the error occurred.
 * @param expectedResponses HTTP response status codes that was expected to be returned in success scenarios for the function.
 * 
 * @returns A detailed error specific to the reason of its presence.
 */
export function refineApiError(error: Error | unknown, apiName: string, functionName: string, expectedResponses: number | number[]): Error {

	if (!(error instanceof Error)) {

		logger.error({ error, functionName }, 'NOT AN ERROR TYPE');
		return new HttpApiError('impossible error occurred', apiName, functionName, null);
	}

	if (error instanceof HttpApiError) {

		logger.error({ error, functionName }, apiName);
		return error;
	}

	let response: HttpApiResponse | null = null;

	if (error instanceof ZodError) {

		logger.error({ error, functionName }, 'Request / Response validation failed');
		return new HttpApiError(error.message, apiName, functionName, response);
	}

	if (!(error instanceof AxiosError)) {

		logger.error({ error, functionName }, 'UNHANDLED ERROR TYPE');
		return new HttpApiError(error.message, apiName, functionName, response);
	}

	if (error.response) {

		response = {
			body: error.response.data,
			headers: error.response.headers,
			statusCode: error.response.status
		};
	}

	// Timeout
	if (error.code === 'ECONNABORTED' && error.message === REQUEST_TIMED_OUT) {

		logger.error({ error, functionName }, REQUEST_TIMED_OUT);
		return new HttpApiError(REQUEST_TIMED_OUT, apiName, functionName, response);
	}

	// Unexpected status code
	if (error.message.startsWith('Request failed with status code ')) {

		logger.error({ error, functionName }, `Unexpected response. Expected [${expectedResponses}]`);

		return new HttpApiError(UNEXPECTED_RESPONSE, apiName, functionName, response);
	}

	logger.error({ error, functionName });
	return new HttpApiError(error.message, apiName, functionName, response);
}

// #endregion