import packageJson from '../package.json' with { type: 'json' };
import { writeFile } from 'fs/promises';

import 'dotenv/config.js';

import { createServer } from '../dist/src/framework/server.js';
// import { registerRoutes } from '../dist/src/routes/router.js';

// ------------------------------------------------------------
// BUILD SERVER TO ALLOW DUMPING GENERATED API CONTRACT TO DISK
// ------------------------------------------------------------

console.log('contracts: start');

const server = await createServer();

// await registerRoutes(server);
await server.ready();

// TODO: make the file name the name and version of the service.
// Both can be imported from the package.json file.

await writeFile(`./${packageJson.name}.yaml`, server.swagger({
	yaml: true
}));

console.log('contracts: success');