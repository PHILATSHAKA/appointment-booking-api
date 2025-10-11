/**
 * Base Error class for system conflict errors.
 */
export class SystemErrorBase extends Error {

	/**
	 * Numerical system identifier of the error.
	 */
	reasonCode: number;

	/**
	 * Initialize the error.
	 * 
	 * @param args.message - The error message.
	 * @param args.reasonCode - The numerical system identifier of the error.
	 */
	constructor({ message, reasonCode }: {
		message: string,
		reasonCode: number
	}) {

		super(message);

		this.name = 'SystemErrorBase';

		this.reasonCode = reasonCode;
	}

	/**
	 * Method to convert the error to a JSON object.
	 * Called when the error is passed to JSON.stringify().
	 * 
	 * @returns The JSON representation of the error.
	 */
	toJSON() {

		return {
			message: this.message,
			reason: '',
			reasonCode: this.reasonCode
		};
	}
}