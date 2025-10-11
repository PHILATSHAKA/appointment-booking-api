// Export a frozen object with system error codes to avoid mutation by reference where imported.
export const systemErrorCodes = Object.freeze({
	SOMETHING_INACTIVE: {
		message: 'some resource type is inactive',
		reason: 'somethingInactive',
		reasonCode: 0
	}
});