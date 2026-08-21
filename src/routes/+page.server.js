import { coffee } from '$lib/examples/coffee.js';

/**
 * Demo data. Local and static on purpose: a library demo that reaches across the
 * network to a live application is a demo that breaks for reasons that have
 * nothing to do with the library.
 */
export function load() {
	return { tree: coffee };
}
