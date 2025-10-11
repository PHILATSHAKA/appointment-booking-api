import { JestConfigWithTsJest } from 'ts-jest';

export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	globalSetup: './tests/util/setup.ts',
	globalTeardown: './tests/util/teardown.ts',
	testRegex: '/tests/test-orchestrator.ts',
	verbose: true,
	reporters: ['default'] // 'summary' to suppress individual results, 'default' to get more verbose output
} as JestConfigWithTsJest;