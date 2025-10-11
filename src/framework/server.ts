import { baseLogger } from '#utils/logger.js';
import { env } from 'process';
import { exists } from '#src/utils/common.js';
import { fileURLToPath } from 'url';
import packageJson from '../../package.json' with { type: 'json' };
import path from 'path';
import { randomUUID as uuid } from 'crypto';

import Fastify, { FastifyRequest } from 'fastify';
import { ZodTypeProvider, hasZodFastifySchemaValidationErrors, jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { FastifyZodInstance } from '#framework/types.js';
import { fastifyAutoload } from '@fastify/autoload';
import fastifyCors from '@fastify/cors';
import fastifyFormUrlEncoded from '@fastify/formbody';
import fastifyHelmet from '@fastify/helmet';
import { fastifyRequestContext } from '@fastify/request-context';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';

/**
 * See {@link https://github.com/fastify/fastify-request-context#typescript fastify request context}
 */
declare module '@fastify/request-context' {
	interface RequestContextData {
		correlationId: string
	}
}

const logger = baseLogger.child({ filePath: import.meta.url });

/**
 * Create a server instance.
 * 
 * @param requestIdHeaderName Optional, name of header on incoming requests to read correlation id from. Default `x-capitec-correlation-id`
 * 
 * NOTE: Fastify lifecycle hook & route handler promise resolution behavior.
 * 
 * This webserver favours async-await style lifecycle hooks & route handlers where the returned value is the value to respond with to the request.
 * 1. Do use async lifecycle hooks & route handlers.
 * 2. Do NOT use `reply.send`.
 * 3. Do return the value that should be responded with to the request.
 * 4. Do resolve promises in the closure in which you wish to handle errors that may be thrown.
 * 
 * Not adhering to the above may result in 'request duplication'.
 * Refer to the warning section below {@link https://www.fastify.io/docs/latest/Reference/Routes/#async-await Fastify routes async-await}.
 * 
 * For the aforementioned reason all lifecycle hooks & server registrations has to be async, explicitly disable relevant eslint rules only where required for these specific scenarios.
 * 
 * Reference: {@link https://www.fastify.io/docs/latest/Reference/Routes/#async-await Fastify routes async-await},
 * {@link https://www.fastify.io/docs/latest/Reference/Routes/#promise-resolution Fastify routes promise resolution}
 */
export async function createServer(requestIdHeaderName = 'x-capitec-correlation-id'): Promise<FastifyZodInstance> {

	// -----------------
	// CREATE NEW SERVER
	// -----------------

	logger.info('Creating server instance');
	const server = Fastify({

		requestIdLogLabel: 'correlationId',

		// DANGER: If specified - figure out how to safely handle, otherwise process would exit.
		// connectionTimeout: 180000,

		// Keep a given connection open for a short duration to allow the client to reuse the socket should
		// additional requests be received within a short duration.
		keepAliveTimeout: 5000,

		// Protect against Slow-loris DoS attacks. Only node version greater or equal to 14.11.0 supports this option.
		// https://www.cloudflare.com/learning/ddos/ddos-attack-tools/slowloris
		// https://en.wikipedia.org/wiki/Slowloris_(computer_security)
		requestTimeout: 5000,

		// Maximum request body size. bytes in binary, e.g. 1048576 = 1mb
		bodyLimit: 1048576,

		// Header in which a correlation id may be supplied.
		requestIdHeader: requestIdHeaderName,

		// Generate a v4 uuid if no correlation was supplied via request header.
		genReqId: () => uuid(),

		// Disable creating sibling head route for get routes.
		exposeHeadRoutes: false
	}).withTypeProvider<ZodTypeProvider>();

	// -----------------------------
	// REGISTER CONTENT TYPE PARSERS
	// -----------------------------

	logger.info('Enabling content-type parsing [application/x-www-form-urlencoded]');
	server.register(fastifyFormUrlEncoded);

	// -----------------------------
	// ENABLE SERVING STATIC CONTENT
	// -----------------------------

	// Only enable static content hosting if the folder exists.
	const staticContentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../static');

	if (await exists(staticContentDir)) {

		logger.info(`Enabling static content hosting from [${staticContentDir}]`);

		server.register(fastifyStatic, {
			root: staticContentDir
		});
	}

	// -----------
	// ENABLE CORS
	// -----------

	if (env.CORS_ALLOWED_ORIGINS) {

		const allowedOrigins = env.CORS_ALLOWED_ORIGINS?.split('|');
		logger.info(`Enabling cors for [${allowedOrigins.join(',')}]`);

		server.register(fastifyCors, {
			hideOptionsRoute: true,
			allowedHeaders: ['Authorization', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Pragma', 'Cache-Control', 'X-Capitec-Correlation-Id'],
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			hook: 'onRequest',
			delegator: async (request: FastifyRequest) => { // eslint-disable-line require-await

				// Utilize delegator to check incoming origin against configured hosts - only respond with CORS headers when the origin matches a configured one.
				// This hides the allowed origin(s), until it is accessed from an allowed origin - in which case only that specific origin is returned in the allowed origin header.

				const origin: string | undefined = request.headers?.origin;

				// Prevent doing further checks if no origin header is present on the incoming request.
				if (!origin) {

					return {
						origin: false
					};
				}

				if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {

					return {
						origin: origin
					};
				}

				logger.info(`Blocked CORS request from origin: [${origin}]`);
				return {
					origin: false
				};
			}
		});
	}

	// ----------------------------------------------------------------
	// CONFIGURE SECURITY BEST PRACTICE BY SETTING VARIOUS HTTP HEADERS
	// ----------------------------------------------------------------

	logger.info('Strapping on default helmet security headers');
	server.register(fastifyHelmet, {
		hidePoweredBy: true
	});

	// ----------------------------------------
	// CONFIGURE REQUEST SCOPED STORAGE SUPPORT
	// ----------------------------------------

	/**
	 * As nodejs runs the event loop and no threads are spawned per request another solution is required to uniquely identify a request.
	 * The request scoped storage creates context available in the call chain (call stack) of an incoming http request received by the HTTP server.
	 */

	logger.info('Enabling request scoped storage');
	server.register(fastifyRequestContext);

	logger.info('Enabling request context correlation ID and default response headers');
	server.addHook('onRequest', async (request, reply) => { // eslint-disable-line require-await

		// Inject the request ID into request scoped storage.
		request.requestContext.set('correlationId', request.id);

		logger.trace({
			correlationId: request.id,
			method: request.method,
			url: request.url,
			headers: request.headers,
			params: request.params,
			query: request.query
		}, 'ON_REQUEST');

		// Always send these headers with all responses.
		reply.header(requestIdHeaderName, request.id);
		reply.header('servicename', packageJson.name);
		reply.header('serviceversion', packageJson.version);
	});

	// ---------------------------------------
	// CONFIGURE REQUEST & RESPONSE VALIDATION
	// ---------------------------------------

	// Use zod type provider serializer to serialize output to defined objects.
	logger.info('Enabling zod serializer');
	server.setSerializerCompiler(serializerCompiler);

	// Use zod type provider validator to validate inputs & outputs.
	logger.info('Enabling zod validator');
	server.setValidatorCompiler(validatorCompiler);

	// ------------------------
	// DEFINE API CONTRACT BASE
	// ------------------------

	logger.info('Enabling API contract generation & hosting');
	server.register(fastifySwagger, {
		openapi: {
			info: {
				title: packageJson.name,
				version: packageJson.version,
				description: packageJson.description,
				license: {
					name: 'Capitec Bank',
					url: 'http://www.capitecbank.co.za'
				},
				contact: {
					name: packageJson.author,
					url: packageJson.bugs.url,
					email: packageJson.bugs.email
				}
			}
		},
		transform: jsonSchemaTransform
	});

	// -------------------------------------------
	// ENABLE SERVING OF API CONTRACT & SWAGGER UI
	// -------------------------------------------

	logger.info('Enabling SwaggerUI hosting');

	const swaggerDocsPath = '/docs/swagger';

	server.register(fastifySwaggerUI, {
		routePrefix: '/docs/swagger',
		uiConfig: {
			validatorUrl: null // Hide the swagger valid / invalid badge as https://validator.swagger.io would not have access to our service contract and always display invalid.
		}
	});

	// Serve scalar docs by default
	server.get('/docs', (_request, reply) => {
		reply.redirect(swaggerDocsPath);
	});
	server.get('/docs/', (_request, reply) => {
		reply.redirect(swaggerDocsPath);
	});

	// -------------------------------
	// CONFIGURE REQUEST TRACE LOGGING
	// -------------------------------

	server.addHook('onSend', async (request, response, payload) => { // eslint-disable-line require-await

		logger.trace({
			correlationId: request.id,
			method: request.method,
			url: request.url,
			headers: request.headers,
			params: request.params,
			query: request.query,
			body: request.body,
			response: {
				statusCode: response.statusCode,
				headers: response.getHeaders(),
				payload: payload
			}
		}, 'ON_SEND');
	});

	server.addHook('onResponse', async (request, response) => { // eslint-disable-line require-await

		logger.trace({
			correlationId: request.id,
			method: request.method,
			url: request.url,
			headers: request.headers,
			params: request.params,
			query: request.query,
			body: request.body,
			response: {
				statusCode: response.statusCode,
				headers: response.getHeaders()
			}
		}, 'ON_RESPONSE');
	});

	// --------------------------------------------------------
	// CONFIGURE ERROR HANDLER FOR BAD REQUESTS & SERVER ERRORS
	// --------------------------------------------------------

	logger.info('Setting up request abortion handling');
	server.addHook('onRequestAbort', async (request) => { // eslint-disable-line require-await

		logger.warn({
			correlationId: request.id,
			method: request.method,
			url: request.url,
			headers: request.headers,
			params: request.params,
			query: request.query
		}, 'ON_REQUEST_ABORT');
	});

	logger.info('Setting up server error handling');
	server.setErrorHandler(async (error, request, reply) => { // eslint-disable-line require-await

		if (error.code === 'FST_ERR_VALIDATION') { // 400 - bad input

			const message = 'API contract violation';

			logger.warn({
				error: error,
				request: {
					method: request.method,
					url: request.url
				}
			}, message);

			return reply.status(400).send({
				message: message,
				context: error.validationContext,
				// Consideration: Prevent validating entire input, fail on first validation failure. Motivation: DoS concern.
				// Consider to explicitly only return 1st error to caller to avoid exposing that the entire request input was validated.
				errors: hasZodFastifySchemaValidationErrors(error) ? error.validation.map(validationIssue => ({
					message: validationIssue.params.issue.message,
					code: validationIssue.params.issue.code,
					path: validationIssue.params.issue.path
				})) : []
			});
		}

		// Log error with appropriate level based on the error type.

		if (error.code === 'FST_ERR_RESPONSE_SERIALIZATION') {

			logger.error({
				error: error,
				request: {
					method: request.method,
					url: request.url
				}
			}, 'ResponseSerializationError');

		} else if (error instanceof SyntaxError) {

			// When bad JSON is received and parsing fails.
			// Reproducible by passing in the following request body to the server:
			// { "username": [ (() => { console.log(true) })() ] }

			logger.warn({
				error: error,
				request: {
					method: request.method,
					url: request.url
				}
			}, 'SyntaxError');

		} else {

			logger.error({
				error: error,
				request: {
					method: request.method,
					url: request.url
				}
			}, 'UNHANDLED SERVER ERROR');
		}

		// Fastify provides reasonable response status codes for errors such as invalid payload or empty payload when a content-type header was set.
		if (error.statusCode) {

			logger.error({
				error: error,
				request: {
					method: request.method,
					url: request.url
				}
			}, 'FRAMEWORK ERROR STATUS CODE SENT');

			return reply.status(error.statusCode).send();
		}

		return reply.status(500).send();
	});

	// ----------------------
	// REGISTER SERVER ROUTES
	// ----------------------

	logger.info('Registering route request handlers');
	// Register all route handlers in the handlers directory.
	server.register(fastifyAutoload, {
		// Consider all files in handlers directory as route handlers.
		dir: path.join(path.dirname(fileURLToPath(import.meta.url)), '../'),
		// Only match files containing ".route." in their name.
		matchFilter: (item) => item.endsWith('.route.js'),
		dirNameRoutePrefix: false
	});

	// ---------------------------------
	// EXPOSE CONFIGURED SERVER INSTANCE
	// ---------------------------------

	return server;
}