/* eslint-disable camelcase */
import { JwtPayload } from 'jsonwebtoken';
import { decodeToken } from '#utils/auth.js';
import { z } from 'zod';

import { baseLogger } from '#utils/logger.js';
import path from 'path';
import querystring from 'querystring';

const logger = baseLogger.child({ fileName: path.basename(import.meta.url), functionName: getToken.name });

const tokenSchema = z.object({
	access_token: z.string(),
	expires_in: z.number(),
	refresh_expires_in: z.number(),
	refresh_token: z.string(),
	token_type: z.string(),
	'not-before-policy': z.number(),
	session_state: z.string(),
	scope: z.string()
});

type Token = z.infer<typeof tokenSchema>;

const tokenCache = new Map<string, Token>();

const tokenRequestBodySchema = z.object({ // eslint-disable-line @typescript-eslint/no-unused-vars
	client_id: z.string(),
	client_secret: z.string(),
	grant_type: z.string(),
	username: z.string().optional(),
	password: z.string().optional(),
	scope: z.string().optional()
});

type TokenRequestBodySchema = z.infer<typeof tokenRequestBodySchema>;

const tokenRequestDetailsSchema = z.object({ // eslint-disable-line @typescript-eslint/no-unused-vars
	authEndpoint: z.string().url(),
	grantType: z.enum(['password']),
	clientId: z.string(),
	clientSecret: z.string(),
	scope: z.string().array().optional(),
	username: z.string().optional(),
	password: z.string().optional()
});

export type TokenRequestDetails = z.infer<typeof tokenRequestDetailsSchema>;

/**
 * Get a valid cached token or a new token from the provided idp
 * @param key - key to get token in cache
 * @param trd - token request details
 */
export async function getToken(key: string, trd: TokenRequestDetails) {

	if (!tokenValid(key)) {
		await fetchToken(key, trd);
	}

	const token = tokenCache.get(key);

	return token?.access_token;
}

/**
 * Get a token from the provided idp details
 * @param key - key to fetch token.
 * @param trd - token request details.
 */
async function fetchToken(key: string, trd: TokenRequestDetails) {

	const form: TokenRequestBodySchema = {
		'client_id': trd.clientId,
		'client_secret': trd.clientSecret,
		'grant_type': trd.grantType,
		scope: trd.scope ? trd.scope.join(' ') : ''
	};

	if (trd.grantType === 'password') {
		form.username = trd.username;
		form.password = trd.password;
	}

	let response;

	try {
		const body = querystring.stringify(form);

		response = await fetch(trd.authEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${Buffer.from(`${trd.clientId}:${trd.clientSecret}`).toString('base64')}`,
				accept: 'application/json',
				'content-type': 'application/x-www-form-urlencoded',
				'content-length': body.length.toString()
			},
			signal: AbortSignal.timeout(5000), // timeout
			body: body
		});

	} catch (error) {
		logger.error({ error }, 'IDP token retrieval error');
		throw error;
	}

	let token;

	try {
		token = tokenSchema.parse(await response.json());
	} catch (error) {
		logger.error({ error }, 'Token malformed');
		throw error;
	}

	tokenCache.set(key, token);
}

/**
 * Checks if token is still valid
 * @param key - key to check token validity.
 */
function tokenValid(key: string) {

	const token = tokenCache?.get(key);

	if (!token) {
		return false;
	}

	const decodedToken = decodeToken(token.access_token);
	// exp is seconds since epoch
	const exp = (decodedToken.payload as JwtPayload)?.exp;

	// Date.Now() is ms since epoch
	// Multiply exp by 1000 to get ms then subtract 60000 ms (1 minute) to ensure token is not close to expiry
	if (!exp || Date.now() >= (exp * 1000) - 60000) {
		tokenCache.delete(key); // it may still be valid for a few seconds, can still use it right now, but should likely initiate refresh / re-auth process
		return false;
	}

	return true;
}

// private variable active token
// public export getToken => return private token variable