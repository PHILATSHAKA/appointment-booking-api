/* eslint-disable camelcase */
import { listSecrets } from '#framework/secrets.js';
import { env as procEnv } from 'process';
import { z } from 'zod';

// Define the schema for the environment variables which are required by the application to function.
// Avoid being too stringent with validation, e.g. too stringent with an expected format.

const stringToArraySchema = z
	.string()
	.nullish()
	.transform((value) => (value ? value.split(',').map((str) => str.trim()) : []));

export const environmentVariablesSchema = z.object({
	// Application
	ENV: z
		.string()
		.regex(/^(local|dev|int|qa|prod)$/)
		.optional(),
	NODE_ENV: z
		.string()
		.regex(/^(development|production)$/)
		.optional(),
	SERVICE_LOG_LEVEL: z
		.string()
		.regex(/^(trace|debug|info|warn|error|fatal)$/)
		.optional(),
	SECRETS_BASE_PATH: z.string().optional(),

	// Server
	PORT: z
		.string()
		.regex(/^\d{1,5}$/)
		.optional(),
	WEB_SERVER_HOST: z.string().optional(),
	HOST_SWAGGER_UI: z
		.string()
		.regex(/^(true|false)$/)
		.optional(),
	CORS_ALLOWED_ORIGINS: z.string().optional(),
	USE_HELMET: z.string().optional(),

	// Client
	TRUSTED_CLIENT_ISSUER: z.string(),
	TRUSTED_CLIENT_JWKS_URI: z.string(),
	TRUSTED_CLIENT_ALLOWED_AUDIENCES: z.string().transform((value) => value.split('|')),

	// Service Account
	SA_AUTHORITY: z.string(),
	SA_CLIENT_ID: z.string(),
	SA_SCOPE: z.string(),

	// OpenFGA
	OPENFGA_API_URL: z.string(),

	// Pulse Permission Model
	MP_PERMISSIONS_STORE_ID: z.string(),
	MP_PERMISSIONS_AUTHORIZATION_MODEL_ID: z.string(),

	// Pulse Audit API
	AUDIT_BASE_API_URL: z.string().url(),

	// POSTGRESQL
	POSTGRESQL_WRITER_HOST: z.string(),
	POSTGRESQL_READER_HOST: z.string(),
	POSTGRESQL_PORT: z.string().transform((value) => Number(value)),
	POSTGRESQL_CONNECTION_LIMIT: z.string().transform((value) => Number(value)),
	POSTGRESQL_ALLOW_EXIT_ON_IDLE: z.string().regex(/^(true|false)$/).transform((value) => Boolean(value)),
	POSTGRESQL_DATABASE: z.string(),
	POSTGRESQL_USER: z.string(),
	DELETE_USER_PROFILE: stringToArraySchema,
	MANAGE_ROLES: stringToArraySchema
});

// Export the type of the environment variables so that it can be referenced throughout the application.
export type EnvironmentVariables = z.infer<typeof environmentVariablesSchema>;

let env: EnvironmentVariables;

export const secretsSchema = z.object({
	openfga_sa_client_secret: z.string()
});

export type Secrets = z.infer<typeof secretsSchema>;

let secrets: Secrets;

try {
	// Parse the environment variables.
	// Should throw an error if any of the expected environment variables are invalid or missing.
	env = environmentVariablesSchema.parse(procEnv);
} catch (error) {
	// Log the error to the console so that the condition can be identified.
	// Cannot use the logger as it would create circular dependency.
	console.log('Required environment variables are missing or invalid.');

	// Re-throw the error to stop the application from starting.
	throw error;
}

try {
	// Retrieve the key names of sensitive secrets available to the application.
	const availableSecrets = await listSecrets();

	// Define the key names of sensitive secrets required by the application to function.
	const expectedSecrets: string[] = []; // TODO: Define keys of secrets required by the application.

	for (const secret of expectedSecrets) {
		if (!availableSecrets.includes(secret)) {
			throw new Error(`Required secret [${secret}] is missing.`);
		}
	}

	secrets = secretsSchema.parse(availableSecrets.reduce((acc: Record<string, string>, secret) => {
		acc[secret] = secret;
		return acc;
	}, {}));

	// console.log('Secrets loaded successfully.', secrets);
} catch (error) {
	// Log the error to the console so that the condition can be identified.
	// Cannot use the logger as it would create circular dependency.
	console.log('Required secrets are missing.');

	// Re-throw the error to crash the application process and prevent it from starting.
	throw error;
}

export { env, secrets };