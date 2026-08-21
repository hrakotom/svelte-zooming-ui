/**
 * Build a hierarchy from hex4's live Freenet task contract.
 *
 * Fetched server-side so there is no cross-origin problem (the demo is served on
 * a different port from the API, so a browser fetch would need CORS).
 *
 * Shape: list -> members -> the tasks each authored. Real data, and it exercises
 * the same 3-level, ~20-node case the coffee wheel stood in for.
 */
export async function fetchTaskTree(fetchImpl = fetch) {
	const res = await fetchImpl('https://hex4.xcayp.com/api/tasks', { signal: AbortSignal.timeout(8000) });
	if (!res.ok) throw new Error(`hex4 returned ${res.status}`);
	const list = await res.json();

	const byAuthor = new Map();
	for (const t of list.tasks ?? []) {
		if (!byAuthor.has(t.author)) byAuthor.set(t.author, []);
		byAuthor.get(t.author).push(t);
	}

	return {
		id: 'root',
		name: list.listName || 'hex4 tasks',
		children: (list.members ?? []).map((m) => ({
			id: m.key, // pubkey: unique by construction
			name: `${m.name} (${m.role})`,
			children: (byAuthor.get(m.key) ?? []).map((t) => ({
				id: t.id, // contract task id — titles are NOT unique, especially truncated
				name: t.title.length > 22 ? t.title.slice(0, 21) + '…' : t.title,
				value: t.done ? 2 : 1
			}))
		}))
	};
}
