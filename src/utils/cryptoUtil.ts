import { BinaryToTextEncoding, createHash } from 'crypto';

/**
 * Create hash from a supplied string.
 * 
 * @param target The string to hash.
 * @param algorithm The algorithm to use for the hash operation. `Default sha256`
 * The algorithm is dependent on the available algorithms supported by the version of OpenSSL on the platform.
 * On recent releases of OpenSSL, openssl list -digest-algorithms will display the available digest algorithms.
 * @param encoding The encoding to use for the hash operation. `Default hex`
 *
 * @returns The hashed string.
 */
export function hash(target: string, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512' = 'sha256', encoding: BinaryToTextEncoding = 'hex'): string {

	// Return hashed string in the requested encoding.
	return createHash(algorithm).update(target).digest(encoding);
}