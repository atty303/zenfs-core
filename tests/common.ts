import { fs } from '../src/index.js';
import { join, relative } from 'path';
import { statSync, readFileSync, readdirSync } from 'fs';

export const fixturesDir = 'tests/fixtures/node';

function copy(_p: string) {
	const p = relative(fixturesDir, _p) || '/';
	const stats = statSync(_p);

	if (!stats.isDirectory()) {
		fs.writeFileSync(p, readFileSync(_p));
		return;
	}

	if (p != '/') {
		fs.mkdirSync(p);
	}
	for (const file of readdirSync(_p)) {
		copy(join(_p, file));
	}
}

copy(fixturesDir);

export { fs };
