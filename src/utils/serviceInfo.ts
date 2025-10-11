/* eslint-disable camelcase */
import { SECRETS_BASE_PATH, listSecrets } from '#resources/secrets.js';
import { formatBytes } from '#utils/common.js';
import { getHeapStatistics } from 'v8';
import os from 'os';
import packageJson from '../../package.json' with { type: 'json' };
import process from 'process';

const info = {
	host: {
		hostName: os.hostname(),
		architecture: os.arch(),
		memory: getFormattedMemoryUsage(),
		heapStats: getFormattedHeapStatistics(),
		cpus: os.cpus().map(cpu => cpu.model),
		platform: os.platform(),
		type: os.type(),
		version: os.version(),
		release: os.release(),
		user: os.userInfo()
	},
	nodejs: {
		version: process.version,
		versions: process.versions
	},
	cwd: process.cwd(),
	env: process.env,
	secretsBasePath: SECRETS_BASE_PATH,
	secrets: await listSecrets(),
	service: {
		name: packageJson.name,
		version: packageJson.version,
		dependencies: packageJson.dependencies
	}
};

/**
 * Get memory information about the current process, for the current point in time, formatted for human interpretation.
 * 
 * @returns Human readable format of the memory info.
 */
function getFormattedHeapStatistics() {

	const heapStats = getHeapStatistics();

	return {
		does_zap_garbage: heapStats.does_zap_garbage,
		external_memory: formatBytes(heapStats.external_memory),
		heap_size_limit: formatBytes(heapStats.heap_size_limit),
		malloced_memory: formatBytes(heapStats.malloced_memory),
		number_of_detached_contexts: heapStats.number_of_detached_contexts,
		number_of_native_contexts: heapStats.number_of_native_contexts,
		peak_malloced_memory: formatBytes(heapStats.peak_malloced_memory),
		total_available_size: formatBytes(heapStats.total_available_size),
		total_global_handles_size: formatBytes(heapStats.total_global_handles_size),
		total_heap_size: formatBytes(heapStats.total_heap_size),
		total_heap_size_executable: formatBytes(heapStats.total_heap_size_executable),
		total_physical_size: formatBytes(heapStats.total_physical_size),
		used_global_handles_size: formatBytes(heapStats.used_global_handles_size),
		used_heap_size: formatBytes(heapStats.used_heap_size)
	};
}

/**
 * Get high-level information about the current process, for the current point in time, formatted for human interpretation.
 * 
 * @returns Human readable format of the memory info.
 */
function getFormattedMemoryUsage() {

	const memoryUsage = process.memoryUsage();

	return {
		rss: formatBytes(memoryUsage.rss),
		heapTotal: formatBytes(memoryUsage.heapTotal),
		heapUsed: formatBytes(memoryUsage.heapUsed),
		external: formatBytes(memoryUsage.external),
		arrayBuffers: formatBytes(memoryUsage.arrayBuffers)
	};
}

/**
 * Get information about the system, process & service, formatted for human interpretation.
 * 
 * @returns Various levels of information about the system, process & service.
 */
export function getInfo() {

	// Update current memory usage before returning.
	info.host.memory = getFormattedMemoryUsage();
	info.host.heapStats = getFormattedHeapStatistics();
	return info;
}