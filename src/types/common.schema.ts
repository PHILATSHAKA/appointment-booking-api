import { z } from 'zod';

export const httpBasicAuthStringSchema = z.string().startsWith('Basic ');
export const httpBearerAuthStringSchema = z.string().startsWith('Bearer ');

export const credentialSchema = z.object({
	username: z.string(),
	password: z.string()
});
export type Credential = z.infer<typeof credentialSchema>;

export const protectedResourceHeadersSchema = z.object({
	authorization: z.string()
});
export type ProtectedResourceHeaders = z.infer<typeof protectedResourceHeadersSchema>;