/**
 * Keep removed items in a list long enough to animate them out.
 *
 * `Positionable` can animate a box INTO existence (`enter_from`) but not out of
 * it, and that asymmetry is not an oversight: by the time your data drops an
 * item, the component is already being destroyed and there is nothing left to
 * animate. Exit is a property of the LIST, not of the box.
 *
 * The obvious alternative — a Svelte `out:` transition inside `Positionable` —
 * looks right and is a trap here. The component culls itself when it leaves the
 * camera's view, so the outro would replay every time a box scrolled off screen.
 * Making it not do that means culling with `display:none` instead of `{#if}`,
 * which keeps every off-screen box's children mounted and reactive. That cull is
 * what makes a large world cheap.
 *
 * Usage — call it ONCE, at component top level, and read the returned function:
 *
 *   const shown = keepAlive(() => items, { ms: 280, key: (i) => i.id });
 *
 *   {#each shown() as it (it.id)}
 *     <Positionable x={it.x} y={it.y} ... transition={280}>
 *       <div style="opacity:{it.leaving ? 1 - it.t : 1}">…</div>
 *     </Positionable>
 *   {/each}
 *
 *   onDestroy(shown.stop);
 *
 * Where an item goes when it leaves is deliberately NOT decided here. Only the
 * caller knows what "home" means — the parent it folded into, the edge of the
 * screen, the row it merged with — so the helper hands back `leaving` and a
 * progress `t`, and the caller aims it.
 */

/**
 * @template T
 * @param {(() => T[]) | T[]} source live items, or a getter for them
 * @param {{ ms?: number, key?: (item: T) => string }} [options]
 * @returns {(() => (T & { leaving: boolean, t: number })[]) & { stop: () => void }}
 */
export function keepAlive(source, options = {}) {
	const ms = options.ms ?? 280;
	const key = options.key ?? ((i) => i.id);

	/** key -> { item, since } for everything on its way out */
	const leaving = new Map();
	/** last live snapshot, so we can tell what disappeared */
	let seen = new Map();

	// Bumped by rAF while anything is leaving. Reading it is what makes a caller's
	// `$derived` re-run each frame — without it the list would be recomputed only
	// when the DATA changed, which during an exit is precisely never.
	let clock = $state(0);
	let raf = 0;

	function pump() {
		if (raf) return;
		const step = () => {
			clock = performance.now();
			raf = leaving.size ? requestAnimationFrame(step) : 0;
		};
		raf = requestAnimationFrame(step);
	}

	function shown() {
		const items = typeof source === 'function' ? source() : source;
		// Read the clock unconditionally: making the subscription depend on whether
		// something happens to be leaving right now means the first exit is never
		// animated, because nothing was leaving when the dependency was captured.
		void clock;

		const now = performance.now();
		const live = new Map(items.map((i) => [key(i), i]));

		for (const [k, item] of seen) {
			if (!live.has(k) && !leaving.has(k)) leaving.set(k, { item, since: now });
		}
		// Back before its exit finished — it is simply present again, at whatever
		// position the live data now gives it.
		for (const k of live.keys()) leaving.delete(k);
		seen = live;

		const out = items.map((i) => ({ ...i, leaving: false, t: 0 }));
		for (const [k, rec] of leaving) {
			const t = (now - rec.since) / ms;
			if (t >= 1) {
				leaving.delete(k);
				continue;
			}
			out.push({ ...rec.item, leaving: true, t });
		}
		if (leaving.size) pump();
		return out;
	}

	shown.stop = () => {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		leaving.clear();
	};

	return shown;
}
