import fs, { type PathLike } from 'fs';

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 * 
 * @param min - The minimum value of the returned int.
 * @param max - The maximum value of the returned int.
 */
export function getRandomInteger(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a password using a given set of characters.
 * 
 * @param constraints Constraints to which the generated password must adhere.
 * @returns The generated password.
 */
export function generatePassword(constraints: {
	minLength: number,
	maxLength: number,
	characterSets: {
		characters: string,
		amountRequired: number
	}[]
}) {

	if (constraints.minLength > constraints.maxLength) {
		throw new Error('Minimum length cant be greater than maximum length.');
	}

	// Ensure that the maximum length constraint allows including the specified amount of characters from each character set.
	const totalCharacterCountRequiredFromSets = constraints.characterSets.reduce((partialSum, a) => partialSum + a.amountRequired, 0);

	if (totalCharacterCountRequiredFromSets > constraints.maxLength) {
		throw new Error('Maximum length constraint does not allow including the required amount of characters from each character set.');
	}

	// Determine what length the generated password will be.
	const length = constraints.minLength === constraints.maxLength ? constraints.minLength : getRandomInteger(constraints.minLength, constraints.maxLength);

	let password = '';

	// Choose the required amount of characters from each character set.
	for (const characterSet of constraints.characterSets) {

		let charsetSelectedValues = '';

		// Choose the specified amount of characters from the set.
		while (charsetSelectedValues.length < characterSet.amountRequired) {

			// Choose a random character from the set.
			charsetSelectedValues += characterSet.characters.charAt(getRandomInteger(0, characterSet.characters.length - 1));
		}

		// Add the selected values from the set to the password.
		password += charsetSelectedValues;
	}

	// Add additional characters until the target character length has been reached.
	while (password.length < length) {

		// Choose another character from a random character set.
		const randomSet = constraints.characterSets[getRandomInteger(0, constraints.characterSets.length - 1)];
		password += randomSet.characters.charAt(getRandomInteger(0, randomSet.characters.length - 1));
	}

	// Shuffle password characters.
	const passwordArray = password.split('');

	for (let i = passwordArray.length - 1; i > 0; i--) {

		const j = Math.floor(Math.random() * (i + 1));
		const temp = passwordArray[i];
		passwordArray[i] = passwordArray[j];
		passwordArray[j] = temp;
	}

	return passwordArray.join('');
}

/**
 * Creates a new object from a supplied object retaining properties which match the supplied filter.
 * 
 * @param target The object to utilize as the base.
 * @param evaluator Function used to filter out properties.
 */
export function filterObject(target: object, evaluator: (key: string, value: any) => boolean): object {
	return Object.fromEntries(Object.entries(target).filter(([entryKey, entryValue]) => evaluator(entryKey, entryValue)));
}

/**
 * Determines whether a value is an object.
 * 
 * @param value Value to be tested.
 */
export function isObject(value: unknown): boolean {
	return typeof value === 'object' && value !== null;
}

/**
 * Convert an amount representing rands to cents.
 * 
 * @param amount The number representing an amount in rand, to be converted to cents.
 * @returns The converted amount in cents.
 */
export function randsToCents(amount: number) {

	// Validate that the provided amount is a number.
	const amountType = typeof amount;
	const expectedType = 'number';

	if (amountType !== expectedType) {
		throw new Error(`Invalid input type was supplied [${amountType}], expected [${expectedType}]`);
	}

	// 1. Convert amount to cents.
	// amountCents = amount * 100;

	// 2. Apply floating point precision, transform the number into a representation which looks correct for display purposes.
	// centsString = amountCents.toFixed(0);

	// 3. Convert the formatted string into a number.
	// Number(centsString);

	return Number((amount * 100).toFixed(0));
}

/**
 * Convert an amount representing cents to rands.
 * 
 * @param amount The number representing an amount in cents, to be converted to rands.
 * @returns The converted amount in rands.
 */
export function centsToRands(amount: number) {

	// Validate that the provided amount is a number.
	const amountType = typeof amount;
	const expectedType = 'number';

	if (amountType !== expectedType) {
		throw new Error(`Invalid input type was supplied [${amountType}], expected [${expectedType}]`);
	}

	// 1. Convert amount to rands.
	// amountRands = amount / 100;

	// 2. Apply floating point precision, transform the number into a representation which looks correct for display purposes.
	// randsString = amountRands.toFixed(2);

	// 3. Convert the formatted string into a number.
	// Number(randsString);

	return Number((amount / 100).toFixed(2));
}

/**
 * Format an amount of bytes into a human friendly representation thereof.
 * 
 * @param bytes The amount of bytes to be formatted.
 * @param decimals Amount of decimals to include.
 * @returns The size in a human friendly formatted representation.
 */
export function formatBytes(bytes: number, decimals = 4) {

	if (!Number(bytes)) {
		return '0 Bytes';
	}

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Determines if a given file path exists on the file system.
 * 
 * @param path The path to check.
 * 
 * @returns True, if the file exists, otherwise false.
 */
export function exists(path: PathLike): Promise<boolean> {

	return new Promise(resolve => {

		fs.access(path, fs.constants.F_OK, err => {

			if (err) {
				return resolve(false);
			}

			return resolve(true);
		});
	});
}

/**
 * Wait for a set amount of milliseconds before continuing to process.
 * 
 * @param duration - The number of milliseconds to sleep for.
 * 
 * @returns Nothing.
 */
export function sleep(duration: number): Promise<void> {

	return new Promise(resolve => {

		setTimeout(() => {
			resolve();
		}, duration);
	});
}

/**
 * Get days between two dates, inclusive of the start and end day.
 * For an example 2023-01-24 and 2023-01-27 there is 4 days.
 * 
 * @param fromDate - The from date selected by the user.
 * @param toDate - The to date selected by the user.
 * 
 * @returns Total number of days between two dates, inclusive of the start and end day.
 */
export function getDaysInDateRange(fromDate: Date, toDate: Date): number {

	// Compare date string part only, in universal time.
	// This is done to avoid taking time and timezone offsets into account.
	const proxyFromDate = new Date(fromDate.toISOString().substring(0, 10));
	const proxyToDate = new Date(toDate.toISOString().substring(0, 10));

	// Calculate number of milliseconds in one day.
	const millisecondsInDay = 24 * 60 * 60 * 1000;

	// Subtract fromDate to toDate to get the difference in milliseconds.
	// Setting hours to 00:00:00 which is midnight.
	const differenceInMilliseconds = proxyFromDate.getTime() - proxyToDate.getTime();

	// Return days calculated from and to date divided by a day and get actual day/s.
	return Math.round(Math.abs(differenceInMilliseconds / millisecondsInDay));
}

/**
 * Validates a South African ID number using the Luhn Algorithm.
 * The Luhn Algorithm, also known as the Luhn formula or modulus 10 algorithm,
 * is a checksum formula used to validate a variety of identification numbers.
 * For more information, see: {@link https://en.wikipedia.org/wiki/Luhn_algorithm}
 * 
 * @param idNumber - idNumber The South African ID number to validate.
 * @returns true if the ID number is valid, false otherwise.
 */
export function isValidRsaIdNumber(idNumber: string) {

	// Empty string or ID number length not equal to 13
	if (!idNumber || !(/^\d{13}$/).test(idNumber)) {
		return false;
	}

	// Remove spaces from the ID number and convert it to an array of digits
	const digits = idNumber.replace(/\s/g, '').split('').map(Number);

	// Reverse the array of digits
	const reversedDigits = digits.reverse();

	// Double every second digit starting from the second right most digit
	const doubledDigits = reversedDigits.map((digit, index) => (index % 2 === 1 ? digit * 2 : digit));

	// Sum up all the digits, taking into account numbers greater than 9
	const sum = doubledDigits.reduce((acc, digit) => acc + (digit > 9 ? digit - 9 : digit), 0);

	// Check if the sum is divisible by 10
	return sum % 10 === 0;
}

/**
 * Checks whether a given date was 18 or more years ago.
 * 
 * @param testDate The date to be tested. 
 * @returns Indication of whether the date was 18 or more years ago.
 */
export function isEighteenYearsOrOlder(testDate: Date): boolean {

	// Get the year eighteen years ago.
	const yearEighteenYearsAgo = new Date().getFullYear() - 18;

	// Get the date eighteen years ago.
	const dateEighteenYearsAgo = new Date(new Date().setFullYear(yearEighteenYearsAgo));

	return testDate <= dateEighteenYearsAgo;
}