/**
 * TTL cache which determines whether the item is valid or must be evicted only when accessed.
 * Advised where cache keys are NOT dynamic and the amount of items in cache cannot grow infinitely.
 * 
 * By not using `setTimeout` and not placing a timer in the event loop, `SimpleTtlCache` may be a good fit for applications where clobbering the event loop is a concern.
 * E.g. items will be not be evicted from cache if the item is not accessed.
 * 
 * Danger: If the cache item is not accessed, the item will never be evicted from cache leading to an infinitely growing cache.
 * This should not be a concern if the implementation will replace the same key with a new value, e.g. not use dynamic keys.
 */
export class SimpleTtlCache<T> {

	#cache: Map<string, { value: T, expiry: number }>;

	/**
	 * Initialize the class.
	 */
	constructor() {
		this.#cache = new Map();
	}

	/**
	 * Get the value from cache.
	 * 
	 * @param key - The key to get the value for.
	 */
	get(key: string) {

		const cacheItem = this.#cache.get(key);

		if (cacheItem && cacheItem.expiry > Date.now()) {
			return cacheItem.value;
		}

		this.#cache.delete(key);
	}

	/**
	 * Store a value in cache for a given duration.
	 * 
	 * @param key - The key to check for.
	 * @param value - The value to set.
	 * @param ttl - The time to live in milliseconds.
	 */
	set(key: string, value: T, ttl: number) {

		this.#cache.set(key, {
			value: value,
			expiry: Date.now() + ttl
		});
	}

	/**
	 * Remove a value from cache.
	 * 
	 * @param key - The key to check for.
	 */
	delete(key: string) {
		this.#cache.delete(key);
	}

	/**
	 * Remove all entries in cache.
	 */
	clear() {
		this.#cache.clear();
	}
}

/**
 * TTL cache which evicts items after a certain amount of time has elapsed, using `setTimeout`.
 * Advised where cache keys are dynamic, to avoid the amount of items in cache from growing infinitely.
 * 
 * Due to the use of `setTimeout` and placing a timer in the event loop, `TimerTtlCache` may be a good fit for applications where clobbering the event loop is not a concern.
 * E.g. items will be evicted from cache even if not accessed.
 */
export class TimerTtlCache<T> {

	#cache: Map<string, T>;

	#timers: Map<string, NodeJS.Timeout>;

	/**
	 * Initialize the class.
	 */
	constructor() {
		this.#cache = new Map();
		this.#timers = new Map();
	}

	/**
	 * Store a value in cache for a given duration.
	 * 
	 * @param key - The key to set the value for.
	 * @param value - The value to set.
	 * @param ttl - The time to live in milliseconds.
	 */
	set(key: string, value: T, ttl: number) {

		if (this.#timers.has(key)) {
			clearTimeout(this.#timers.get(key));
		}

		this.#timers.set(key, setTimeout(() => this.#cache.delete(key), ttl));

		this.#cache.set(key, value);
	}

	/**
	 * Get the value from cache.
	 * 
	 * @param key - The key to get the value for.
	 */
	get(key: string) {
		return this.#cache.get(key);
	}

	/**
	 * Check whether a value for a given key exists in cache.
	 * 
	 * @param key - The key to check for.
	 */
	has(key: string) {
		return this.#cache.has(key);
	}

	/**
	 * Remove a value from cache.
	 * 
	 * @param key - The key to check for.
	 */
	delete(key: string) {

		if (this.#timers.has(key)) {
			clearTimeout(this.#timers.get(key));
		}
		this.#timers.delete(key);
		return this.#cache.delete(key);
	}

	/**
	 * Remove all entries from cache.
	 */
	clear() {

		this.#cache.clear();

		for (const timeout of this.#timers.values()) {
			clearTimeout(timeout);
		}

		this.#timers.clear();
	}
}