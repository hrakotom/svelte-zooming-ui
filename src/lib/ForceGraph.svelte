<script>
	/**
	 * Zoomable force-directed tree — the amCharts demo's behaviour, built on d3
	 * for the maths and this library for the camera.
	 *
	 * Written in runes; `Positionable` is still a legacy component, which is fine
	 * because Svelte 5 decides runes mode per component.
	 *
	 * Interaction is per-node EXPAND/COLLAPSE: the graph opens at `initialDepth`
	 * levels and clicking a node with children folds it open or shut. Nothing else
	 * leaves the screen, so the click reads as "show me more" rather than "throw
	 * the rest away".
	 *
	 * (The amCharts original instead keeps a depth WINDOW around the clicked node
	 * and drops everything outside it. That suits a deep tree; on a three-level one
	 * clicking a leaf leaves two nodes on screen and looks like a crash.)
	 *
	 * Division of labour: d3 owns the layout maths, Svelte owns the DOM. No d3
	 * selections, no enter/exit — a keyed `{#each}` does that, and gets us exit
	 * transitions for free, which is otherwise the fiddliest part of the effect.
	 */
	import { onDestroy } from 'svelte';
	import Decimal from 'decimal.js';
	import Positionable from './Positionable.svelte';
	import { hierarchy } from 'd3-hierarchy';
	import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
	import { scaleSqrt, scaleOrdinal } from 'd3-scale';
	import { schemeTableau10 } from 'd3-scale-chromatic';

	let {
		data,
		/** Levels open on first render. 1 = the root's children are showing. */
		initialDepth = 1,
		manyBodyStrength = -240,
		linkStrength = 0.5,
		linkDistance = 90,
		// Links are drawn by this component rather than the consumer, so the one
		// thing a consumer must be able to change is whether they are visible
		// against its background. The default suits a light canvas.
		linkColour = 'rgba(20,30,50,.35)',
		// Called with the clicked node's datum, expandable or not — a leaf has
		// nothing to unfold, so this is how a consumer surfaces one (a detail panel,
		// usually) instead of the click doing nothing at all.
		onselect = undefined,
		world = 2000
	} = $props();


	// --- tree -----------------------------------------------------------------
	//
	// Derived, not built once: this graph is pointed at live contract state, so
	// `data` changes under it whenever someone adds a task. Rebuilding the
	// hierarchy in a $derived means the component reacts instead of needing to be
	// remounted — and remounting would reset the camera on every push.
	const tree = $derived.by(() => {
		const root = hierarchy(data);
		// Path-based ids, not names: real hierarchies repeat names at different
		// depths (the coffee dataset has a "Nutty" category containing a "Nutty"
		// subcategory), and a name key would collide in the {#each}.
		// Prefer an explicit id from the data — labels are display text and are NOT
		// unique in practice (live task titles collide once truncated). Path is only
		// a fallback for datasets that carry no ids.
		root.each(
			(d) =>
				(d.__id =
					d.data.id ?? d.ancestors().reverse().map((a) => a.data.name ?? '?').join('/'))
		);
		const vals = root.leaves().map((l) => l.data.value ?? 1);
		const radius = scaleSqrt()
			.domain([Math.min(...vals, 1), Math.max(...vals, 1)])
			.range([14, 34]);
		return { root, radius };
	});

	const colour = scaleOrdinal(schemeTableau10);

	let selectedId = $state(null);

	// Expansion is a list of ids rather than a flag on each hierarchy node,
	// because `tree` is rebuilt whenever the data changes — a flag would be lost
	// on every push. Ids survive that; unknown ids simply never match.
	//
	// `null` means UNTOUCHED, and is not the same as "nothing expanded": while
	// untouched, the open set is derived from the data, so a graph whose data
	// arrives after mount still opens to `initialDepth`. Seeding once in an
	// effect instead left an async consumer showing a lone root forever — the
	// first render had no children to seed from.
	let userExpanded = $state(null);

	const defaultExpanded = $derived.by(() => {
		const ids = [];
		tree.root.each((d) => {
			if (d.depth < initialDepth && d.children) ids.push(d.__id);
		});
		return ids;
	});

	const expandedIds = $derived(userExpanded ?? defaultExpanded);

	/** A node shows if the root, or if every ancestor between it and the root is open. */
	const visible = $derived.by(() => {
		const open = new Set(expandedIds);
		const keep = new Set();
		const walk = (n) => {
			keep.add(n);
			if (open.has(n.__id)) (n.children ?? []).forEach(walk);
		};
		walk(tree.root);
		return keep;
	});

	/** Has children, but they are folded away — worth signalling, or it looks like a leaf. */
	const collapsed = $derived.by(() => {
		const open = new Set(expandedIds);
		const out = new Set();
		for (const n of visible) if (n.children?.length && !open.has(n.__id)) out.add(n.__id);
		return out;
	});

	// --- simulation -----------------------------------------------------------
	//
	// Node objects are REUSED across window changes, keyed by id. Rebuilding them
	// each time would reset x/y/vx/vy and make the whole graph re-shuffle instead
	// of settle; reusing them means the simulation resumes rather than restarts.
	const pool = new Map();

	function nodeFor(d) {
		let n = pool.get(d.__id);
		if (!n) {
			// Seed a new node AT ITS PARENT, with a little jitter. This one line is
			// what makes expansion look like unfolding rather than teleporting.
			const p = d.parent && pool.get(d.parent.__id);
			n = {
				id: d.__id,
				d,
				x: (p?.x ?? 0) + (Math.random() - 0.5) * 24,
				y: (p?.y ?? 0) + (Math.random() - 0.5) * 24
			};
			pool.set(d.__id, n);
		}
		n.d = d;
		n.r = d.children ? 26 : tree.radius(d.data.value ?? 1);
		return n;
	}

	const sim = forceSimulation()
		.force('charge', forceManyBody().strength(manyBodyStrength))
		.force('centre', forceCenter(0, 0))
		.force('collide', forceCollide().radius((n) => n.r + 6))
		.force(
			'link',
			forceLink()
				.id((n) => n.id)
				.distance(linkDistance)
				.strength(linkStrength)
		)
		.on('tick', publish);

	// d3 mutates its own node objects in place, and those are not reactive. So each
	// tick publishes a plain snapshot into $state — Svelte re-renders from that and
	// never sees a d3 object. Keeps the template a pure keyed {#each}.
	let view = $state({ nodes: [], links: [] });

	function publish() {
		view = {
			nodes: sim.nodes().map((n) => ({ id: n.id, x: n.x, y: n.y, r: n.r, node: n.d })),
			links: sim
				.force('link')
				.links()
				.map((l) => ({ id: l.id, x1: l.source.x, y1: l.source.y, x2: l.target.x, y2: l.target.y }))
		};
	}

	/**
	 * What the layout actually depends on: which nodes and links exist, and how
	 * big each node is. NOT object identity — a live consumer hands us a freshly
	 * built hierarchy on every poll or push, and re-heating the simulation for
	 * each one makes the graph visibly pulse every few seconds while converging
	 * on the layout it already had.
	 */
	let lastSignature = '';

	$effect(() => {
		const keep = visible;
		const ns = [...keep].map(nodeFor);
		const ls = [...keep]
			.filter((d) => d.parent && keep.has(d.parent))
			.map((d) => ({ id: `${d.parent.__id}>${d.__id}`, source: d.parent.__id, target: d.__id }));

		// Drop pooled nodes that left the window, so they re-seed at their parent
		// if they come back rather than flying in from a stale position.
		for (const id of [...pool.keys()]) if (!ns.some((n) => n.id === id)) pool.delete(id);

		const signature = ns.map((n) => `${n.id}:${n.r}`).join('|') + '#' + ls.map((l) => l.id).join('|');
		if (signature === lastSignature) {
			// Same graph. The pooled node objects were already updated in place by
			// `nodeFor`, so there is nothing for the simulation to do — and telling
			// it to reheat would only undo the settling it has just finished.
			publish();
			return;
		}
		lastSignature = signature;

		sim.nodes(ns);
		sim.force('link').links(ls);
		sim.alpha(0.8).restart();
		publish();
	});

	onDestroy(() => sim.stop());

	function select(n) {
		selectedId = n.id;
		onselect?.(n.node.data);
		if (!n.node.children?.length) return;
		// First interaction takes a copy of whatever is currently open, which is
		// what stops the derived default from overwriting the user's choice.
		userExpanded = expandedIds.includes(n.id)
			? expandedIds.filter((x) => x !== n.id)
			: [...expandedIds, n.id];
		// Deliberately NO camera move. Re-centring made sense when a click replaced
		// the visible set; now that nothing leaves the screen, moving the camera
		// only rescales everything the user was already looking at. Panning and
		// zooming stay where they belong — drag and wheel.
	}

	const D = (v) => Decimal(Number.isFinite(v) ? v : 0);
</script>

<!-- Links live in one world-sized Positionable so the SVG never resizes.
     Nodes are individual Positionables so each can be clicked and focused. -->
<!-- The `scale(1,-1)` is load-bearing: Positionable places content in a y-UP
     world, SVG's own axis is y-DOWN. Without the flip the links render mirrored
     about the horizontal centre — same topology, so it looks like a layout
     glitch rather than a coordinate bug, with rays converging on empty space. -->
<Positionable
	x={Decimal(0)}
	y={Decimal(0)}
	width={Decimal(world)}
	height={Decimal(world)}
	depth={Decimal(1)}
>
	<svg
		viewBox="{-world / 2} {-world / 2} {world} {world}"
		style="width:100%;height:100%;overflow:visible;pointer-events:none;"
	>
		<g transform="scale(1,-1)">
		{#each view.links as l (l.id)}
			<line
				x1={l.x1 ?? 0}
				y1={l.y1 ?? 0}
				x2={l.x2 ?? 0}
				y2={l.y2 ?? 0}
				stroke={linkColour}
				stroke-width="2"
			/>
		{/each}
		</g>
	</svg>
</Positionable>

{#each view.nodes as n (n.id)}
	{@const size = n.r * 2}
	<!-- reference_width matters: Positionable authors content at that pixel width and
	     then scales it, so a label sized against the default 500 renders sub-pixel.
	     Authoring at 100 makes the font a sensible fraction of the node. -->
	<Positionable
		x={D(n.x)}
		y={D(n.y)}
		width={D(size)}
		height={D(size)}
		depth={Decimal(2)}
		reference_width={100}
	>
		<button
			type="button"
			onclick={() => select(n)}
			title={n.node.data.name}
			style="width:100%;height:100%;border-radius:50%;cursor:pointer;padding:2px;
			       border:{n.id === selectedId ? 'solid rgba(10,20,40,.85) 3px' : 'solid rgba(255,255,255,.75) 2px'};
			       box-shadow:{collapsed.has(n.id) ? '0 0 0 3px rgba(255,255,255,.30)' : 'none'};
			       background:{colour(n.node.depth)};
			       display:flex;align-items:center;justify-content:center;
			       font:600 11px/1.05 system-ui,sans-serif;letter-spacing:-.2px;color:rgba(10,15,25,.85);
			       overflow:hidden;text-align:center;"
		>
			{n.node.data.name ?? ''}
		</button>
	</Positionable>
{/each}
