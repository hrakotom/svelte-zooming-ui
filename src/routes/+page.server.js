import { fetchTaskTree } from '$lib/examples/hex4.js';
import { coffee } from '$lib/examples/coffee.js';

export async function load({ fetch }) {
	// Live contract data when reachable; the coffee wheel is the fallback so the
	// demo still works with hex4 down — which is the whole point of the thing it
	// is displaying.
	try {
		return { tree: await fetchTaskTree(fetch), live: true };
	} catch {
		return { tree: coffee, live: false };
	}
}
