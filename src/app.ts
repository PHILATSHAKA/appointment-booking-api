import type { FastifyZodTypeProvider } from '#src/global.js';
import { baseLogger } from '#utils/logger.js';
import { createServer } from '#framework/server.js';
import { env } from 'process';
import path from 'path';
import { sleep } from '#utils/common.js';
import { startExpireBookingsWorker } from './workers/expireBookingsJob.js';

const logger = baseLogger.child({ fileName: path.basename(import.meta.url), functionName: 'entrypoint' });

let server: FastifyZodTypeProvider | undefined;

/**
 * Gracefully release resources.
 */
async function disposeResources() {
	try {
		if (server) {
			// Stop listening for incoming requests.
			await server.close();
		}
	} catch (error) {
		logger.error(error, 'error disposing resources');
	}
}

// Catch ctrl-c, so that event 'exit' always works even in windows.
// Required to test exiting on windows.
process.on('SIGINT', async () => {
	logger.warn('SIGINT received');
	await disposeResources();
	process.exit(); // eslint-disable-line no-process-exit
});

// NOTE: SIGNAL NOT SENT ON WINDOWS
// Required when running in a linux environment, e.g. in k8s on a linux based container image.
process.on('SIGTERM', async () => {
	logger.warn('SIGTERM received');
	await disposeResources();
	process.exit(); // eslint-disable-line no-process-exit
});

/**
 * Main entrypoint of application.
 */
try {
	server = await createServer();

	// -----------------------
	// DECORATE REQUEST OBJECT
	// -----------------------

	/**
	 * See {@link https://fastify.dev/docs/latest/Reference/TypeScript#plugins} for request decoration.
	 * Has to correspond with the properties defined in the global.d.ts file.
	 */
	server.decorateRequest('decodedToken', null);
	server.decorateRequest('tokenString', '');

	// -----------------------------------
	// ENSURE ALL PLUGINS HAVE BEEN LOADED
	// -----------------------------------

	logger.info('Ensuring all server plugins have loaded');
	await server.ready();

	// ----------------------------
	// START LISTENING FOR REQUESTS
	// ----------------------------

	const host = env.WEB_SERVER_HOST || '0.0.0.0'; // In containerized environments, localhost does not exist - best to listen on all interfaces.
	const port = Number(env.WEB_SERVER_PORT) || 4000;

	const listeningOn = await server.listen({
		host: host,
		port: port
	});

	logger.info(`Server listening on ${listeningOn}`);
	console.log(`Server listening on ${listeningOn}`);

	if (env.HOST_SWAGGER_UI && env.HOST_SWAGGER_UI.toLowerCase() === 'true') {
		logger.info(`Docs available at http://localhost:${port}/docs`);
	}
	startExpireBookingsWorker();
} catch (error) {
	logger.fatal({ error: error }, 'top level error occurred - exiting');

	await disposeResources();

	// Wait before exiting to allow log buffer / stream to be persisted to disk.
	await sleep(50);
	process.exit(1); // eslint-disable-line no-process-exit
}