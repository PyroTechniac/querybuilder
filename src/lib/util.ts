export function mergeDefault<A, B extends Partial<A>>(defaults: A, given?: B): A & B {
	if (!given) return deepClone(defaults) as A & B;
	for (const key in defaults) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		if (typeof given[key] === 'undefined') given[key] = deepClone(defaults[key]);
		else if (isObject(given[key])) given[key] = mergeDefault(defaults[key], given[key]);
	}

	return given as A & B;
}

export function deepClone<T>(source: T): T {
	// Check if it's a primitive (with exception of function and null, which is typeof object)
	if (source === null || isPrimitive(source)) return source;
	if (Array.isArray(source)) {
		const output = [] as unknown as T & T extends (infer S)[] ? S[] : never;
		for (const value of source) output.push(deepClone(value));
		return output as unknown as T;
	}
	if (isObject(source)) {
		const output = {} as unknown as Partial<T>;
		for (const [key, value] of Object.entries(source)) output[key] = deepClone(value);
		return output as unknown as T;
	}
	if (source instanceof Map) {
		const output = new (source.constructor as MapConstructor)() as unknown as T & T extends Map<infer K, infer V> ? Map<K, V> : never;
		for (const [key, value] of source.entries()) output.set(key, deepClone(value));
		return output as unknown as T;
	}
	if (source instanceof Set) {
		const output = new (source.constructor as SetConstructor)() as unknown as T & T extends Set<infer K> ? Set<K> : never;
		for (const value of source.values()) output.add(deepClone(value));
		return output as unknown as T;
	}
	return source;
}

export function isPrimitive(value: unknown): boolean {
	return PRIMITIVE_TYPES.includes(typeof value);
}

export function isObject(input: unknown): boolean {
	return input && input.constructor === Object;
}

export const PRIMITIVE_TYPES = ['string', 'bigint', 'number', 'boolean'];
