import { FastifyZodInstance } from '#framework/types.js';

// ------------------------
// IMPORT ENDPOINT HANDLERS
// ------------------------

/**
 * Registers routes on an server.
 * 
 * @param server Server on which to register routes.
 */
export default async (server: FastifyZodInstance) => { // eslint-disable-line require-await

	// This endpoint must return a status code in the range of 200-399 before other probes will be started.
	server.route({
		method: 'GET',
		// Using /ping as instana classifies this path as a synthetic call.
		// https://www.ibm.com/docs/en/instana-observability/current?topic=applications-endpoints#default-synthetic-endpoints
		url: '/ping',
		schema: {
			tags: ['Framework'],
			summary: 'Startup probe',
			hide: true
		},
		handler: (_request, reply) => reply.status(204).send()
	});

	// This endpoint must return a status code in the range of 200-399 to indicate the service is ready to serve requests.
	// If a status code outside of this range is returned, k8s would remove the service from the load balancer and it would appear unavailable to callers
	// returning a 503 response.
	server.route({
		method: 'GET',
		// Using /ready as instana classifies this path as a synthetic call.
		// https://www.ibm.com/docs/en/instana-observability/current?topic=applications-endpoints#default-synthetic-endpoints
		url: '/ready',
		schema: {
			tags: ['Framework'],
			summary: 'Readiness probe',
			hide: true
		},
		handler: (_request, reply) => reply.status(204).send()
	});

	// TODO: Check configuration and if environmental dependencies are available.
	// DO NOT check external dependencies, only check dependencies which are expected to be available 24/7 without zero downtime.
	// Checking external dependencies which can be offline for whatever reason and cause this check to fail would result in this endpoint failing
	// which in turn could result in k8s taking the service offline as it is indicated not to be ready to accept incoming requests.
	// E.g. check if each required secret is available
	// This endpoint must return a status code in the range of 200-399 to indicate the service is ready to serve requests.
	server.route({
		method: 'GET',
		// Using /healthcheck as instana classifies this path as a synthetic call.
		// https://www.ibm.com/docs/en/instana-observability/current?topic=applications-endpoints#default-synthetic-endpoints
		url: '/healthcheck',
		schema: {
			tags: ['Framework'],
			summary: 'Liveness probe',
			hide: true
		},
		handler: (_request, reply) => reply.status(204).send()
	});
};

export const prefixOverride = '';