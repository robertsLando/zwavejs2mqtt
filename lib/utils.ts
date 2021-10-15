// eslint-disable-next-line one-var
import * as appRoot from 'app-root-path'
import { version } from '../package.json'
import { ValueID } from 'zwave-js'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'

let VERSION: string

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends Array<infer U>
		? Array<DeepPartial<U>>
		: T[P] extends ReadonlyArray<infer U>
		? ReadonlyArray<DeepPartial<U>>
		: DeepPartial<T[P]>
}

export interface ErrnoException extends Error {
	errno?: number
	code?: string
	path?: string
	syscall?: string
	stack?: string
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Constructor<T = {}> = new (...args: any[]) => T

export function applyMixin(
	target: Constructor,
	mixin: Constructor,
	includeConstructor = false
): void {
	// Figure out the inheritance chain of the mixin
	const inheritanceChain: Constructor[] = [mixin]
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const current = inheritanceChain[0]
		const base = Object.getPrototypeOf(current)
		if (base?.prototype) {
			inheritanceChain.unshift(base)
		} else {
			break
		}
	}
	for (const ctor of inheritanceChain) {
		for (const prop of Object.getOwnPropertyNames(ctor.prototype)) {
			// Do not override the constructor
			if (includeConstructor || prop !== 'constructor') {
				Object.defineProperty(
					target.prototype,
					prop,
					Object.getOwnPropertyDescriptor(ctor.prototype, prop) ??
						Object.create(null)
				)
			}
		}
	}
}

/**
 *  Get the base root path to application directory. When we are in a `pkg` environment
 *  the path of the snapshot is not writable
 */
export function getPath(write: boolean): string {
	if (write && hasProperty(process, 'pkg')) return process.cwd()
	else return appRoot.toString()
}

/**
 * path.join wrapper, the first option can be a boolean and it will automatically fetch the root path
 * passing the boolean to getPath
 */
export function joinPath(write: boolean | string, ...paths: string[]): string {
	if (typeof write === 'boolean') {
		write = getPath(write)
	}
	return path.join(write, ...paths)
}

/**
 * Join props with a `_` and skips undefined props
 */
export function joinProps(...props: (string | number)[]): string {
	props = props || []
	let ret = props[0].toString() || ''
	for (let i = 1; i < props.length; i++) {
		const p = props[i]
		if (p !== null && p !== undefined && p !== '') {
			ret += '_' + (typeof p === 'number' ? p.toString() : p)
		}
	}
	return ret
}

/**
 * Checks if an object is a valueId, returns error otherwise
 */
export function isValueId(v: ValueID): boolean | string {
	if (typeof v.commandClass !== 'number' || v.commandClass < 0) {
		return 'invalid `commandClass`'
	}
	if (v.endpoint !== undefined && v.endpoint < 0) {
		return 'invalid `endpoint`'
	}
	if (
		v.property === undefined ||
		(typeof v.property !== 'string' && typeof v.property !== 'number')
	) {
		return 'invalid `property`'
	}
	if (
		v.propertyKey !== undefined &&
		typeof v.propertyKey !== 'string' &&
		typeof v.propertyKey !== 'number'
	) {
		return 'invalid `propertyKey`'
	}
	return true
}

/**
 * Deep copy of an object
 */
export function copy<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj))
}

/**
 * Converts a decimal to an hex number of 4 digits and `0x` as prefix
 */
export function num2hex(num: number): string {
	const hex = num >= 0 ? num.toString(16) : 'XXXX'
	return '0x' + '0'.repeat(4 - hex.length) + hex
}

/**
 * Gets the actual package.json version with also the git revision number at the end of it
 */
export function getVersion(): string {
	if (!VERSION) {
		let revision: string
		try {
			revision = execSync('git rev-parse --short HEAD').toString().trim()
		} catch (error) {
			// git not installed
		}
		VERSION = `${version}${revision ? '.' + revision : ''}`
	}

	return VERSION
}

/**
 * Sanitize chars of a string to use in a topic
 *
 */
export function sanitizeTopic(
	str: string | number,
	sanitizeSlash = false
): string {
	if (typeof str === 'number' || !str) return str.toString()

	if (sanitizeSlash) {
		str = removeSlash(str)
	}

	// replace spaces with '_'
	str = str.replace(/\s/g, '_')
	// remove special chars
	return str.replace(/[^A-Za-z0-9-_À-ÖØ-öø-ÿ/]/g, '')
}

/**
 * Removes `/` chars from strings
 */
export function removeSlash(str: string | number): string {
	return typeof str === 'number' ? str.toString() : str.replace(/\//g, '-')
}

/**
 * Check if an object has a property
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function hasProperty(obj: {}, prop: string): boolean {
	return Object.prototype.hasOwnProperty.call(obj, prop)
}

/**
 * Gets the size in a human readable form starting from bytes
 */
export function humanSize(bytes: number): string {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

	if (bytes === 0) {
		return 'n/a'
	}

	const i = Math.floor(Math.log(bytes) / Math.log(1024))

	if (i === 0) {
		return bytes + ' ' + sizes[i]
	}

	return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

export async function hashPsw(password: crypto.BinaryLike): Promise<string> {
	return new Promise((resolve, reject) => {
		const salt = crypto.randomBytes(8).toString('hex')

		crypto.scrypt(password, salt, 64, (err, derivedKey) => {
			if (err) reject(err)
			resolve(salt + ':' + derivedKey.toString('hex'))
		})
	})
}

export async function verifyPsw(
	password: crypto.BinaryLike,
	hash: string
): Promise<boolean> {
	return new Promise((resolve, reject) => {
		const [salt, key] = hash.split(':')
		crypto.scrypt(password, salt, 64, (err, derivedKey) => {
			if (err) reject(err)
			resolve(key === derivedKey.toString('hex'))
		})
	})
}

/**
 * Checks if a string is a hex buffer
 */
export function isBufferAsHex(str: string): boolean {
	return /^0x([a-fA-F0-9]{2})+$/.test(str)
}

/**
 * Parses a buffer from a string has the form 0x[a-f0-9]+
 */
export function bufferFromHex(hex: string): Buffer {
	return Buffer.from(hex.substr(2), 'hex')
}

/**
 * Converts a buffer to an hex string
 */
export function buffer2hex(buffer: Buffer): string {
	if (buffer.length === 0) return ''
	return `0x${buffer.toString('hex')}`
}

export function allSettled(promises: Promise<any>[]): Promise<any> {
	const wrappedPromises = promises.map((p) =>
		Promise.resolve(p).then(
			(val) => ({ status: 'fulfilled', value: val }),
			(err) => ({ status: 'rejected', reason: err })
		)
	)
	return Promise.all(wrappedPromises)
}
