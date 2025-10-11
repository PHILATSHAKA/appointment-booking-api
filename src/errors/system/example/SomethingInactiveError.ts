import { SystemErrorBase } from '#errors/system/SystemErrorBase.js';
import { systemErrorCodes } from '#errors/system/systemErrorCodes.js';

/**
 * Error indicating merchant is inactive in merchant data.
 */
export class SomethingInactiveError extends SystemErrorBase {

	/**
	 * Initialize the error.
	 * 
	 * @param message - The error message.
	 */
	constructor(message?: string) {

		super({
			message: message || systemErrorCodes.SOMETHING_INACTIVE.message,
			reasonCode: systemErrorCodes.SOMETHING_INACTIVE.reasonCode
		});

		this.name = 'SomethingInactiveError';
	}
}