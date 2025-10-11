import { env } from 'process';
// import { getSecret } from '#framework/secrets.js';
import pg from 'pg';

const DATABASE_USER_PASSWORD = 'postgres';

export const dbConnectionPool = new pg.Pool({
	host: env.POSTGRESQL_HOST,
	port: env.POSTGRESQL_PORT,
	database: env.POSTGRESQL_DATABASE,
	user: env.POSTGRESQL_USER,
	password: DATABASE_USER_PASSWORD,
	max: env.POSTGRESQL_CONNECTION_LIMIT,
	allowExitOnIdle: env.POSTGRESQL_ALLOW_EXIT_ON_IDLE === true,
	ssl: false
});