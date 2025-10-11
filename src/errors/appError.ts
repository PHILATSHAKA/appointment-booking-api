/**
 *
 */
export class AppError extends Error {
	public statusCode: number;

	public details?: any;

	/**
	 *
	 * @param statusCode
	 * @param message
	 * @param details
	 */
	constructor(statusCode: number, message: string, details?: any) {
		super(message);
		this.statusCode = statusCode;
		this.details = details;
		Error.captureStackTrace(this, this.constructor);
	}
}