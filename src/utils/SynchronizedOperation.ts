type AsyncOperation<T> = () => Promise<T>;

/**
 * Helper class to synchronize async operations and avoid it being invoked concurrently.
 */
export class SynchronizedOperation<T> {

	/**
	 * Pointer to a pending async action.
	 */
	private pendingAction?: Promise<T>;

	/**
	 * Executes an async operation, ensuring that it is not invoked multiple times concurrently.
	 * 
	 * @param asyncOperation Async operation to avoid being invoked multiple times concurrently.
	 * @returns The result of the async operation.
	 */
	execute(asyncOperation: AsyncOperation<T>) {

		if (this.pendingAction) {
			return this.pendingAction;
		}

		this.pendingAction = asyncOperation().finally(() => {
			this.pendingAction = undefined;
		});

		return this.pendingAction;
	}
}