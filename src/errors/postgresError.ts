import { DatabaseError } from 'pg';

import { AppError } from './appError.js';

export enum PostgresErrorCode {
	UniqueViolation = '23505',
	ForeignKeyViolation = '23503',
	NotNullViolation = '23502',
	SyntaxError = '42601',
	ConnectionFailure = '08006'
}

/**
 * Handles PostgreSQL errors by inspecting the Postgres error code and throwing a corresponding AppError.
 *
 * This function maps known PostgreSQL error codes (e.g., unique violations, foreign key violations)
 * to meaningful HTTP status codes and messages for REST API responses.
 *
 * @param error - The original error object thrown by the PostgreSQL client (pg).
 * @param context -
 * @throws {AppError} Throws an instance of AppError with appropriate HTTP status code and message.
 */
export function handlePostgresError(error: any, context: string): never {
	if (error instanceof DatabaseError) {
		const code = error.code;
		switch (code) {
			case PostgresErrorCode.UniqueViolation:
				throw new AppError(409, `Conflict during [${context}]`, {
					reason: error.detail || 'Duplicate entry',
					constraint: error.constraint
				});
			case PostgresErrorCode.ForeignKeyViolation:
			case PostgresErrorCode.NotNullViolation:
				throw new AppError(500, `Invalid reference or data during [${context}]`, {
					column: error.column,
					detail: error.detail
				});

			case PostgresErrorCode.ConnectionFailure:
				throw new AppError(503, `Database connection failed [${context}]`, {
					detail: error.detail
				});

			default:
				throw new AppError(500, `Database error during ${context}`, {
					code: code,
					message: error.message,
					detail: error.detail,
					table: error.table
				});
		}
	}

	// Unknown error not from pg
	throw new AppError(500, `Unexpected error during ${context}`, {
		error: error.message || error
	});
}