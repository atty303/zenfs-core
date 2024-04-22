// Utilities and shared data

import { ApiError, ErrorCode } from '../ApiError.js';
import { InMemory } from '../backends/InMemory.js';
import { Cred, rootCred } from '../cred.js';
import type { File } from '../file.js';
import { FileSystem } from '../filesystem.js';
import { normalizePath } from '../utils.js';
import { resolve } from './path.js';

// credentials
export let cred: Cred = rootCred;
export function setCred(val: Cred): void {
	cred = val;
}

// descriptors
export const fdMap: Map<number, File> = new Map();
let nextFd = 100;
export function getFdForFile(file: File): number {
	const fd = nextFd++;
	fdMap.set(fd, file);
	return fd;
}
export function fd2file(fd: number): File {
	if (!fdMap.has(fd)) {
		throw new ApiError(ErrorCode.EBADF);
	}
	return fdMap.get(fd);
}

// mounting
export interface MountMapping {
	[point: string]: FileSystem;
}

/**
 * The map of mount points
 * @internal
 */
export const mounts: Map<string, FileSystem> = new Map();

/*
Set a default root.
*/
mount('/', InMemory.create({ name: 'root' }));

/**
 * Mounts the file system at the given mount point.
 */
export function mount(mountPoint: string, fs: FileSystem): void {
	if (mountPoint[0] !== '/') {
		mountPoint = '/' + mountPoint;
	}
	mountPoint = resolve(mountPoint);
	if (mounts.has(mountPoint)) {
		throw new ApiError(ErrorCode.EINVAL, 'Mount point ' + mountPoint + ' is already in use.');
	}
	mounts.set(mountPoint, fs);
}

/**
 * Unmounts the file system at the given mount point.
 */
export function umount(mountPoint: string): void {
	if (mountPoint[0] !== '/') {
		mountPoint = `/${mountPoint}`;
	}
	mountPoint = resolve(mountPoint);
	if (!mounts.has(mountPoint)) {
		throw new ApiError(ErrorCode.EINVAL, 'Mount point ' + mountPoint + ' is already unmounted.');
	}
	mounts.delete(mountPoint);
}

/**
 * Gets the internal FileSystem for the path, then returns it along with the path relative to the FS' root
 */
export function resolveMount(path: string): { fs: FileSystem; path: string; mountPoint: string } {
	path = normalizePath(path);
	const sortedMounts = [...mounts].sort((a, b) => (a[0].length > b[0].length ? -1 : 1)); // decending order of the string length
	for (const [mountPoint, fs] of sortedMounts) {
		// We know path is normalized, so it would be a substring of the mount point.
		if (mountPoint.length <= path.length && path.startsWith(mountPoint)) {
			path = path.slice(mountPoint.length > 1 ? mountPoint.length : 0); // Resolve the path relative to the mount point
			if (path === '') {
				path = '/';
			}
			return { fs, path, mountPoint };
		}
	}

	throw new ApiError(ErrorCode.EIO, 'ZenFS not initialized with a file system');
}

/**
 * Reverse maps the paths in text from the mounted FileSystem to the global path
 */
export function fixPaths(text: string, paths: { [from: string]: string }): string {
	for (const [from, to] of Object.entries(paths)) {
		text = text?.replaceAll(from, to);
	}
	return text;
}

export function fixError<E extends Error>(e: E, paths: { [from: string]: string }): E {
	if (typeof e.stack == 'string') {
		e.stack = fixPaths(e.stack, paths);
	}
	e.message = fixPaths(e.message, paths);
	return e;
}

export function mountMapping(mountMapping: MountMapping): void {
	if ('/' in mountMapping) {
		umount('/');
	}
	for (const [point, fs] of Object.entries(mountMapping)) {
		mount(point, fs);
	}
}

/**
 * Types supports as path parameters.
 *
 * In the future, maybe support URL?
 */
export type PathLike = string;
