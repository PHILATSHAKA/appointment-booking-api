import { exit } from 'process';
import fse from 'fs-extra';

// ----------------------------------------
// COPY STATIC CONTENT INTO BUILD DIRECTORY
// ----------------------------------------

const sourceDirectory = './src/static';
const destinationDirectory = './dist/src/static';

if (!await fse.exists(sourceDirectory)) {

	console.log(`copying static content: skipping - no source found at [${sourceDirectory}]`);
	exit(0);
}

console.log('copying static content: start');

await fse.copy(sourceDirectory, destinationDirectory, {
	overwrite: true
});

console.log('copying static content: success');