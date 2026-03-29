import { Credential, credentialSchema, httpBasicAuthStringSchema } from '#types/common.schema.js';
import jwt, { Jwt, VerifyErrors } from 'jsonwebtoken';
import jwks from 'jwks-rsa';
import { z } from 'zod';

import { baseLogger } from '#utils/logger.js';
const logger = baseLogger.child({ filePath: import.meta.url });

// Module scoped key-value pairs of secrets.
const jwksClients = new Map<string, jwks.JwksClient>();

/**
 * Convert an HTTP basic scheme authentication string to a username-password credential.
 * 
 * {@link https://datatracker.ietf.org/doc/html/rfc2617#section-2 RFC2617}
 * @param basicAuthString The HTTP basic scheme authentication string.
 * @returns A username-password credential.
 */
export function basicSchemeAuthStringToCredential(basicAuthString: string | undefined): Credential {

	try {

		const safeInput = httpBasicAuthStringSchema.parse(basicAuthString);

		const clearTextCredential = z.string().regex(/^.*[:].*$/).parse(Buffer.from(safeInput.split(' ')[1], 'base64').toString('utf8'));

		const [username, password] = clearTextCredential.split(':');

		return credentialSchema.parse({
			username: decodeURIComponent(username),
			password: decodeURIComponent(password)
		});

	} catch (error) {

		if (error instanceof Error) {

			logger.warn({ error: error, functionName: basicSchemeAuthStringToCredential.name });
			throw error;
		}

		logger.warn({ error: error, functionName: basicSchemeAuthStringToCredential.name }, 'Impossible error occurred');
		throw error;
	}
}

/**
 * Breaks down a well formatted HTTP authentication header value into its scheme and value.
 * 
 * @param value - The scheme value to extract from the header value.
 * @param scheme - The expected HTTP authentication scheme.
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes MDN Authentication schemes}
 * 
 * @returns authHeaderValue - Value from which the HTTP Authentication detail must be derived from.
 */
export function getHttpAuthFromHeaderValue(value: string | undefined, scheme: 'Bearer' | 'Basic') {

	if (!value) {
		throw new Error('authorization required');
	}

	// Get the HTTP auth scheme and corresponding value from the Authorization header.
	const [httpAuthScheme, httpAuthValue] = value.split(' ');

	// References
	// Bearer: https://datatracker.ietf.org/doc/html/rfc6750
	if (httpAuthScheme !== scheme) {
		throw new Error(`Unsupported HTTP authentication scheme [${httpAuthScheme}]. Expected [${scheme}]`);
	}

	if (!httpAuthValue) {
		throw new Error('Token not provided in accordance with supported HTTP authentication scheme');
	}

	return httpAuthValue;
}

/**
 * Verifies the signature of a JWT.
 * 
 * @param {string} token The JWT token string.
 * @param {jwt.Secret} secretOrPublicKey The secret or public key used to verify the token signature.
 * @param {jwt.VerifyOptions} [options] Options relating to the verification.
 * @throws {Error} When the token isn't valid or signature verification failed.
 * @returns {Promise<jwt.Jwt>|Promise<jwt.JwtPayload>} The decoded JWT object.
 */
export function verifyJwtSignature(token: string, secretOrPublicKey: jwt.Secret, options: jwt.VerifyOptions = {}): Promise<string | jwt.Jwt | jwt.JwtPayload | undefined> {

	return new Promise((resolve, reject) => {

		jwt.verify(token, secretOrPublicKey, options, (error, verifiedDecodedToken) => {

			if (error) {

				logger.warn({ error: error, functionName: verifyJwtSignature.name });

				return reject(error);
			}

			return resolve(verifiedDecodedToken);
		});
	});
}

/**
 * Decodes a JWT token.
 * 
 * @param tokenString The token string to decode.
 * 
 * @returns A decoded JWT object.
 */
export function decodeToken(tokenString: string) {

	// Ensure a token string was provided.
	if (!tokenString) {
		throw new Error('No token was provided to decode.'); // AUTHENTICATION_REQUIRED
	}

	try {

		// Decode the contents of the token string.
		const token = jwt.decode(tokenString, { complete: true });

		if (!token) {
			throw new Error('Decoded token is empty.'); // AUTHENTICATION_REQUIRED
		}

		return token as jwt.Jwt;

	} catch (error) {
		throw new Error(`Unable to decode token. ${(error as Error).message}`); // AUTHENTICATION_REQUIRED
	}
}

/**
 * Helper function to compliment `validateToken()`.
 * Reduces need to write repetitive boilerplate to check whether a authorization header & value was presented.
 * 
 * Detail about some parameters can be obtained from the IDP's well-known OIDC endpoint.
 * See {@link https://login.microsoftonline.com/capitecbank.onmicrosoft.com/.well-known/openid-configuration | AAD well-known OIDC URL}
 * 
 * @param authorizationHeader - The HTTP Authorization header value.
 * @param issuer The string identifier to uniquely identify the IDP.
 * Must match the `iss` claim in tokens issued by the IDP.
 * See {@link https://sts.windows.net/a428b46f-c29b-4a6c-85f1-8e05c10b6671/ | AAD issuer URI}
 * 
 * @param jwksUri The JSON Web Key Set URI on which the signing key signatures are publicly exposed.
 * See {@link https://login.microsoftonline.com/common/discovery/keys | AAD jwks URI}
 * 
 * @param allowedAudiences Optional, the audience claims which are allowed in the token.
 *
 * @returns A promise containing the decoded token, it if is valid.
 */
export function validateAuthHeaderToken(
	authorizationHeader: string | undefined,
	issuer: string,
	jwksUri: string,
	allowedAudiences: string | RegExp | [string | RegExp, ...(string | RegExp)[]] | undefined = undefined
) {

	const httpAuthentication = getHttpAuthFromHeaderValue(authorizationHeader, 'Bearer');

	return validateToken(httpAuthentication, issuer, jwksUri, allowedAudiences);
}

/**
 * Decodes and validates a JWT token signature.
 * 
 * Detail about some parameters can be obtained from the IDP's well-known OIDC endpoint.
 * See {@link https://login.microsoftonline.com/capitecbank.onmicrosoft.com/.well-known/openid-configuration | AAD well-known OIDC URL}
 * 
 * @param tokenString The token string to decode and validate.
 * @param issuer The string identifier to uniquely identify the IDP.
 * Must match the `iss` claim in tokens issued by the IDP.
 * See {@link https://sts.windows.net/a428b46f-c29b-4a6c-85f1-8e05c10b6671/ | AAD issuer URI}
 * 
 * @param jwksUri The JSON Web Key Set URI on which the signing key signatures are publicly exposed.
 * See {@link https://login.microsoftonline.com/common/discovery/keys | AAD jwks URI}
 * 
 * @param allowedAudiences Optional, the audience claims which are allowed in the token.
 *
 * @returns A promise containing the decoded token, it if is valid.
 */
export async function validateToken(
	tokenString: string,
	issuer: string,
	jwksUri: string,
	allowedAudiences: string | RegExp | [string | RegExp, ...(string | RegExp)[]] | undefined = undefined
): Promise<jwt.Jwt> {

	// Decode the contents of the token string.
	const token = decodeToken(tokenString);

	// Ensure the decoded token has a key ID specified in the header before attempting to verify the signature.
	if (!token.header.kid) {
		return Promise.reject(new Error('Token does not have key ID in header.')); // AUTHENTICATION_REQUIRED
	}

	const tokenIssuer = (token.payload as { iss: string }).iss;

	// Ensure the decoded token has an issuer specified in the payload before attempting to retrieve the jwks client for the token issuer.
	if (!tokenIssuer) {
		return Promise.reject(new Error('Token does not have issuer in payload.')); // AUTHENTICATION_REQUIRED
	}

	if (!jwksClients.has(tokenIssuer)) {

		if (tokenIssuer !== issuer) {

			const error = new Error(`Token was issued by untrusted IDP [${tokenIssuer}], trusted IDP [${issuer}]`);

			logger.warn({ error: error, functionName: validateToken.name });

			return Promise.reject(error);
		}

		logger.warn({ functionName: validateToken.name }, `Adding JWKS client for issuer [${issuer}]`);

		// Add JSON Web Token Key Set client to cache if the token originated from a trusted issuer and it does not already exist.
		jwksClients.set(issuer, jwks({
			jwksUri: jwksUri,
			cache: true,
			cacheMaxEntries: 10,
			// milliseconds * 60 = minutes
			// minutes * 60 = hours
			// hours * 24 = days
			cacheMaxAge: 1000 * 60 * 60 * 24 * 7, // 604,800,000 milliseconds = 7 days
			rateLimit: true,
			jwksRequestsPerMinute: 10,
			timeout: 1000 * 10
		}));
	}

	const jwksClient = jwksClients.get(issuer);

	if (!jwksClient) {

		const friendlyError = new Error(`Unable to obtain JWKS client for issuer [${issuer}].`);

		logger.error({ error: friendlyError, functionName: validateToken.name });

		return Promise.reject(friendlyError);
	}

	let key: jwks.SigningKey;

	// Verify signature of the token and return decoded token.
	try {

		key = await jwksClient.getSigningKey(token.header.kid);

	} catch (error) {

		const friendlyError = new Error(`Unable to obtain signing key for kid [${token.header.kid}]. ${(error as Error).message} `);

		logger.warn({ error: friendlyError, functionName: validateToken.name });

		return Promise.reject(friendlyError);
	}

	return new Promise((resolve, reject) => {

		try {

			return jwt.verify(
				tokenString,
				key.getPublicKey(),
				{
					audience: allowedAudiences,
					algorithms: ['RS256', 'RS384', 'RS512'],
					complete: true
				},
				(error: VerifyErrors | null, verifiedToken: Jwt | undefined) => {

					if (error) {

						const friendlyError = new Error(`Token verification failed. ${(error as Error).message}`);

						logger.warn({ error: friendlyError, functionName: validateToken.name });

						return reject(friendlyError);
					}

					return resolve(verifiedToken as jwt.Jwt);
				}
			);

		} catch (error) {

			const friendlyError = new Error(`Token validation failed. ${(error as Error).message}`);

			logger.warn({ error: friendlyError, functionName: validateToken.name });

			return reject(friendlyError);
		}
	});
}

/**
 * Determines if a JWT token contains any of a list of authorized roles.
 * 
 * The JWT token roles to check roles against.
 * A list of roles allowed to access a resource.
 * 
 * @param tokenRoles - The roles contained in the JWT token.
 * @param authorizedRoles - The roles allowed to access a resource.
 */
export function validateTokenRoles(tokenRoles: string[], authorizedRoles: string[]) {

	if (authorizedRoles.length === 0) {
		return;
	}

	// Ensure the token contains roles claim.
	if (!tokenRoles || tokenRoles.length === 0) {
		throw new Error('Token does not have roles claim.'); // UNAUTHORIZED
	}

	// Ensure the token contains one of the required roles.
	let hasRequiredRole = false;

	for (const allowedRole of authorizedRoles) {

		if (tokenRoles.includes(allowedRole)) {
			hasRequiredRole = true;
			break;
		}
	}

	// Reject if the token roles does not contain one of the authorized roles.
	if (!hasRequiredRole) {
		throw new Error('Token does not have authorized role.'); // UNAUTHORIZED
	}
}