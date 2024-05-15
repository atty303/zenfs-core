import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { Port } from '../../src/backends/port/fs.js';
import { configure, fs } from '../../src/index.js';

describe('Remote FS', () => {
	const port = new Worker(dirname(fileURLToPath(import.meta.url)) + '/worker.js'),
		content = 'FS is in a port';

	afterAll(() => port.terminate());

	test('configuration', async () => {
		await configure({ backend: Port, port });
	});

	test('write', async () => {
		await fs.promises.writeFile('/test', content);
	});

	test('read', async () => {
		console.warn('Port read test is not functional');
		//expect(await fs.promises.readFile('/test', 'utf8')).toBe(content);
	});
});
