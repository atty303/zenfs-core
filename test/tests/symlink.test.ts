import { backends, fs, configure, tmpDir, fixturesDir } from '../common';
import * as path from 'path';

describe.each(backends)('%s Link and Symlink Test', (name, options) => {
	const configured = configure(options);

	it('should create and read symbolic link', async () => {
		await configured;
		if (fs.getMount('/').metadata.supportsLinks) {
			const linkData = path.join(fixturesDir, '/cycles/root.js');
			const linkPath = path.join(tmpDir, 'symlink1.js');

			// Delete previously created link
			try {
				await fs.promises.unlink(linkPath);
			} catch (e) {}

			await fs.promises.symlink(linkData, linkPath);
			console.log('symlink done');

			const destination = await fs.promises.readlink(linkPath);
			expect(destination).toBe(linkData);
		}
	});

	it('should create and read hard link', async () => {
		await configured;
		if (fs.getMount('/').metadata.supportsLinks) {
			const srcPath = path.join(fixturesDir, 'cycles', 'root.js');
			const dstPath = path.join(tmpDir, 'link1.js');

			// Delete previously created link
			try {
				await fs.promises.unlink(dstPath);
			} catch (e) {}

			await fs.promises.link(srcPath, dstPath);
			console.log('hard link done');

			const srcContent = await fs.promises.readFile(srcPath, 'utf8');
			const dstContent = await fs.promises.readFile(dstPath, 'utf8');
			expect(srcContent).toBe(dstContent);
		}
	});
});

describe.each(backends)('%s Symbolic Link Test', (name, options) => {
	const configured = configure(options);

	// test creating and reading symbolic link
	const linkData = path.join(fixturesDir, 'cycles/');
	const linkPath = path.join(tmpDir, 'cycles_link');

	beforeAll(async () => {
		await configured;

		// Delete previously created link
		await fs.promises.unlink(linkPath);

		console.log('linkData: ' + linkData);
		console.log('linkPath: ' + linkPath);

		await fs.promises.symlink(linkData, linkPath, 'junction');
		return;
	});

	it('should lstat symbolic link', async () => {
		await configured;
		if (fs.getMount('/').metadata.readonly || !fs.getMount('/').metadata.supportsLinks) {
			return;
		}

		const stats = await fs.promises.lstat(linkPath);
		expect(stats.isSymbolicLink()).toBe(true);
	});

	it('should readlink symbolic link', async () => {
		await configured;
		if (fs.getMount('/').metadata.readonly || !fs.getMount('/').metadata.supportsLinks) {
			return;
		}
		const destination = await fs.promises.readlink(linkPath);
		expect(destination).toBe(linkData);
	});

	it('should unlink symbolic link', async () => {
		await configured;
		if (fs.getMount('/').metadata.readonly || !fs.getMount('/').metadata.supportsLinks) {
			return;
		}
		await fs.promises.unlink(linkPath);
		expect(await fs.promises.exists(linkPath)).toBe(false);
		expect(await fs.promises.exists(linkData)).toBe(true);
	});
});