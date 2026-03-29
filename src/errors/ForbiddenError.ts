/**
 * Error indicative that the action being executed within the current context is forbidden.
 */
export class ForbiddenError extends Error {

	/**
	 * Initialize the error.
	 * 
	 * @param {string} message The error message.
	 */
	constructor(message: string) {

		super(message);

		this.name = 'ForbiddenError';
	}
}