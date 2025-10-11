import { env } from 'process';
import { exists } from '#utils/common.js';
import fsp from 'fs/promises';
import { join } from 'path';

// Base path from which secret files would be resolved.
export const SECRETS_BASE_PATH = env.SECRETS_BASE_PATH ?? '/vault/secrets';

// Module scoped key-value pairs of secrets.
const secrets = new Map<string, string | Buffer>();

/**
 * Get the value of a given secret.
 * 
 * @param key Identifier of the secret.
 * @param encoding Optional, encoding to use when reading the secret value. 
 * Default `'utf8'`
 * @returns The secret value.
 */
export async function getSecret(key: string, encoding: BufferEncoding = 'utf8') {

	// Return the secret from cache if already cached.
	if (secrets.has(key)) {
		return secrets.get(key) as string | Buffer;
	}

	const targetSecretServicePath = join(`${SECRETS_BASE_PATH}/service`, '/', key);
	const targetSecretSharedPath = join(`${SECRETS_BASE_PATH}/shared`, '/', key);
	let targetSecretPath;

	if (await exists(targetSecretServicePath)) {
		targetSecretPath = targetSecretServicePath;
	} else if (await exists(targetSecretSharedPath)) {
		targetSecretPath = targetSecretSharedPath;
	}

	// If the targeted secret exists as a file in the base secrets path, cache and then return it.
	if (targetSecretPath) {
		const secret = await fsp.readFile(targetSecretPath, { encoding: encoding });

		if (!secret) {
			throw new Error(`Secret key [${key}] value undefined or empty in [${targetSecretPath}]`);
		}

		secrets.set(key, secret);
		return secret;
	}

	// Avoid using logger as this function may be called during startup which may lead to circular dependency problems.
	console.log(`Secret key [${key}] not found in [${targetSecretPath}]`);

	throw new Error(`Secret key [${key}] not found`);
}

/**
 * Get list of secret files available to the running service.
 * 
 * @returns List of secret files in the base secrets path. Empty array is returned if the secrets base path does not exist.
 */
export async function listSecrets() {
	const localSecrets: string[] = [];

	if (await exists(`${SECRETS_BASE_PATH}/service`)) {
		localSecrets.push(...(await fsp.readdir(`${SECRETS_BASE_PATH}/service`)));
	}

	if (await exists(`${SECRETS_BASE_PATH}/shared`)) {
		localSecrets.push(...(await fsp.readdir(`${SECRETS_BASE_PATH}/shared`)));
	}

	return localSecrets;
}