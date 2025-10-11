/**
 * Error indicative that the identity within the current context is not authorized to perform the action.
 */
export class UnauthorizedError extends Error {

	/**
	 * Initialize the error.
	 * 
	 * @param {string} message The error message.
	 */
	constructor(message: string) {

		super(message);

		this.name = 'UnauthorizedError';
	}
}