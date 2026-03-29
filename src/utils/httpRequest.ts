import type { AxiosRequestConfig, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';
import axios from 'axios'; // eslint-disable-line no-duplicate-imports

import { type ZodSchema, z } from 'zod';
import { requestContext } from '@fastify/request-context';

import { baseLogger } from '#utils/logger.js';
const logger = baseLogger.child({ filePath: import.meta.url, functionName: request.name });

export const REQUEST_TIMED_OUT = 'REQUEST_TIMED_OUT';

type RequestConfig<T extends Record<number, ZodSchema | undefined>, S extends ZodSchema> = {

	body?: z.infer<S>

	/** Data sent with the request would be validated against this schema. */
	bodySchema?: S,

	/** Response status codes other than these would cause an error to be thrown. */
	expectedResponses?: T,
	method: 'get' | 'put' | 'post' | 'delete',
} & Omit<AxiosRequestConfig, 'data'>

/**
 * Make a HTTP request.
 * 
 * @param requestConfig Configuration relating to the request to be performed.
 * @param correlationIdHeaderName Optional, name of the header in which to send the cross-service request tracing ID.
 * Default `x-capitec-correlation-id`.
 */
export async function request<T extends Record<number, ZodSchema | undefined>, S extends ZodSchema>(
	requestConfig: RequestConfig<T, S>,
	correlationIdHeaderName = 'x-capitec-correlation-id'
): Promise<{
	[K in keyof T]: {
		statusCode: K,
		headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
		// @ts-expect-error TypeScript does not recognize T[K] as satisfying the constraint, but it works as intended.
		body: z.infer<T[K]>
	}
}[keyof T]> {

	// Create a copy of the request config which extends the options type.
	// This is done to prevent users from specifying a `data` property in the request config, but to allow us to specify it in the request.
	const axiosRequestOptions: RequestConfig<T, S> & { data?: any } = requestConfig;

	// Add correlation ID header to outgoing request.
	// Only add it if the correlation ID header name is specified. This allows the user to explicitly pass in an empty string to avoid sending a correlation ID.
	if (correlationIdHeaderName) {

		// Add additional / default headers to outgoing request, but allow it to be explicitly overwritten by caller.
		axiosRequestOptions.headers = {
			[correlationIdHeaderName]: requestContext.get('correlationId') ?? '',
			...axiosRequestOptions.headers
		};
	}

	try {

		// Parse request body when a schema was provided.
		axiosRequestOptions.data = axiosRequestOptions.bodySchema ? axiosRequestOptions.bodySchema.parse(axiosRequestOptions.body) : axiosRequestOptions.body;

	} catch (error) {

		logger.error({ error }, 'pre-request input parsing failed');
		throw error;
	}

	// Parse querystring to support array syntax.
	// Required as axios does not support array syntax in querystring, but its type does not convey this.
	try {

		if (axiosRequestOptions.params) {

			const params = new URLSearchParams();

			for (const [key, value] of Object.entries(axiosRequestOptions.params)) {

				if (Array.isArray(value)) {

					for (const arrayValue of value) {
						params.append(key, arrayValue);
					}

				} else {
					params.append(key, value as string);
				}
			}

			axiosRequestOptions.params = params;
		}

	} catch (error) {

		logger.error({ error }, 'pre-request params parsing failed');
		throw error;
	}

	// Determine whether an error must be thrown by comparing the actual status code with what is specified as expected.
	axiosRequestOptions.validateStatus = (statusCode) => {

		if (!axiosRequestOptions.expectedResponses) {
			return true;
		}

		return Object.keys(axiosRequestOptions.expectedResponses).includes(statusCode.toString());
	};

	// Specify the timeout error message so that when it occurs, we control how it can be identified.
	axiosRequestOptions.timeoutErrorMessage = REQUEST_TIMED_OUT;

	// Make the request.
	const response = await axios.request(axiosRequestOptions);

	// Parse response body against schema corresponding to the received status code.
	// Retrieve schema for the given response status code.
	const responseSchema = axiosRequestOptions.expectedResponses?.[response.status];

	return {
		statusCode: response.status,
		headers: response.headers,
		// Don't parse the response when a schema was not defined for the accompanying expected status code.
		body: responseSchema ? responseSchema.parse(response.data) : response.data
	};
}