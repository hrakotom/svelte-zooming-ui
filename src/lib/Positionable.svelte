<script>
	/**
	 * Positionable component that represents an element with a specific position and size within the zoomable UI.
	 * It calculates its visibility and transformation based on the camera's view and updates
	 * its style accordingly. It also provides a frame context for child components to align themselves within the UI.
	 * This component is essential for positioning and rendering elements at the correct scale and position.
	 * @component
	 */
	import { onMount, onDestroy, getContext, setContext, untrack } from 'svelte';
	import { BROWSER } from 'esm-env';
	import Decimal from 'decimal.js';
	import { evaluateCoords } from '$lib/utils.js';
	import compare from 'just-compare';
	import { writable } from 'svelte/store';

	/**
	 * @type {{ x: any, y: any, width: any, height: any, depth: any, reference_width?: number,
	 *          debug?: boolean, pointer_events?: string | null,
	 *          transition?: number, easing?: string,
	 *          enter_from?: { x?: any, y?: any, width?: any, height?: any } | null,
	 *          children?: import('svelte').Snippet,
	 *          positionable?: import('svelte').Snippet }}
	 */
	let {
		x, y, width, height, depth,
		reference_width = 500,
		debug = false,
		/**
		 * Overrides `pointer-events` on the box itself. Pass `"none"` for anything
		 * purely decorative.
		 *
		 * A box is a plain `<div>` and therefore eats clicks over its whole square,
		 * including the transparent parts. A ring drawn around a node — larger than
		 * the node, same depth, rendered after it — is enough to swallow every click
		 * meant for the node underneath, and the symptom is baffling: the node
		 * collapses fine, then cannot be expanded again, because collapsing is what
		 * made the ring appear.
		 */
		pointer_events = null,
		/**
		 * Milliseconds to spend animating to a new x/y/width/height. `0` (the
		 * default) sets them immediately, which is the old behaviour.
		 *
		 * DEFAULT OFF ON PURPOSE. If your positions come from a per-frame source — a
		 * force simulation, a physics step, a scroll — a transition restarts on every
		 * one of those frames toward a target that has already moved, and the box
		 * trails the truth by `transition` ms forever. Turn this on for boxes placed
		 * from DATA, where every change would otherwise be a teleport; leave it off
		 * for boxes placed by something that is already animating them.
		 */
		transition = 0,
		/** `linear` | `quad-out` | `cubic-out` | `cubic-in-out` | `cubic-in`. */
		easing = 'cubic-out',
		/**
		 * Where the box animates FROM on first appearance. Any subset of
		 * x/y/width/height; whatever is omitted starts at its final value.
		 *
		 * This is the cheap half of saying where something came from. A box that
		 * grows out of its parent has explained its own origin; one that materialises
		 * in place has not. Needs `transition` to be non-zero to do anything.
		 */
		enter_from = null,
		children,
		positionable
	} = $props();

	/**
	 * Easings, inlined rather than pulled from a library. Four curves is not worth a
	 * dependency, and the camera's own tween already carries anime.js for the cases
	 * that want more.
	 */
	const EASINGS = {
		'linear': (t) => t,
		'quad-out': (t) => t * (2 - t),
		'cubic-out': (t) => 1 - Math.pow(1 - t, 3),
		'cubic-in': (t) => t * t * t,
		'cubic-in-out': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
	};

	/**
	 * The box as DRAWN, which is not always the box as asked for.
	 *
	 * Everything downstream — the transform, the culling test, `$frame`, and so
	 * every stroke width and LOD band a child derives from it — reads these and not
	 * the props. Otherwise a box would animate while its contents rendered for
	 * where it was going, which looks like the content is sliding inside the box.
	 */
	let shown = $state({ x, y, width, height });

	/** Interpolate in Decimal. The camera adjusts Decimal precision at depth, and
	    doing this in doubles throws that away exactly where it is needed most. */
	const lerp = (from, to, t) => Decimal(from).plus(Decimal(to).minus(Decimal(from)).times(t));

	let tween = null;
	let tween_raf = 0;

	function animateTo(target) {
		const ease = EASINGS[easing] ?? EASINGS['cubic-out'];
		// Retarget from where the box IS, not from where the last tween started, so
		// a new destination mid-flight bends the path instead of snapping back.
		//
		// UNTRACKED, and this is not optional. This runs inside the effect that
		// watches x/y/width/height, and the rAF below writes `shown` on every frame.
		// Read it normally and the effect depends on the thing it is animating: each
		// frame retriggers the effect, which restarts the tween from a fresh `t0`,
		// which schedules another frame. The tween never completes, the effect never
		// stops, and the tab locks up hard enough that devtools cannot be opened.
		tween = { from: untrack(() => ({ ...shown })), to: target, t0: performance.now() };
		if (tween_raf) return;
		const step = () => {
			const t = Math.min(1, (performance.now() - tween.t0) / transition);
			const e = ease(t);
			shown = {
				x: lerp(tween.from.x, tween.to.x, e),
				y: lerp(tween.from.y, tween.to.y, e),
				width: lerp(tween.from.width, tween.to.width, e),
				height: lerp(tween.from.height, tween.to.height, e)
			};
			tween_raf = t < 1 ? requestAnimationFrame(step) : 0;
			if (t >= 1) tween = null;
		};
		tween_raf = requestAnimationFrame(step);
	}

	let entered = false;

	$effect(() => {
		if (!BROWSER) return;
		const target = { x, y, width, height };
		if (!transition) {
			shown = target;
			return;
		}
		if (untrack(() => !entered)) {
			entered = true;
			// First paint starts at `enter_from` where given, its real value where
			// not, and then runs the normal tween to the target.
			shown = {
				x: enter_from?.x ?? x,
				y: enter_from?.y ?? y,
				width: enter_from?.width ?? width,
				height: enter_from?.height ?? height
			};
			if (!enter_from) return;
		}
		animateTo(target);
	});

	/**
	 * NO `will-change: transform` here, deliberately, and it must not come back.
	 *
	 * It reads like the obvious optimisation for something that is transformed on
	 * every frame, and it was here for exactly that reason. What it actually does
	 * is promote the box to a composited layer and PIN that layer's raster scale.
	 * The compositor then satisfies a scale change by stretching the bitmap it
	 * already has instead of re-rendering the content — so as the camera zooms in,
	 * a one-pixel stroke is magnified into a fifteen-pixel smear and text turns to
	 * mush. It never recovers; the layer is still blurred after seconds of idle.
	 *
	 * That is fatal for a zooming UI specifically, because scale is the one thing
	 * this component changes. Measured on a real page at 21x: identical camera,
	 * identical DOM, the property removed at runtime — smeared before, crisp
	 * after. Geometry was never the problem; `stroke-width * CTM` came out at
	 * exactly 1.000 at every zoom tested, up to 427x, while the screen showed a
	 * fat blurry line.
	 *
	 * There is no CSS for "composite this, but re-raster when I scale it", so the
	 * choice is compositing or sharpness, and a zooming UI has to pick sharpness.
	 */
	let previous_to_check = null;
	let evaluated = $state(null);

	let camera = getContext('camera');
	let current_style = $state("display:none;");

	let frame = writable({});
	setContext('frame', frame);
	setContext("reference_width", reference_width);

	$effect(() => {
		if (!BROWSER) return;
		$frame.x = shown.x;
		$frame.y = shown.y;
		$frame.width = shown.width;
		$frame.height = shown.height;
		$frame.depth = depth;
	});

	onMount(function () {
		// console.log("Props: " + JSON.stringify(Object.keys($$props), null, ' '));
	});

	onDestroy(() => {
		if (tween_raf) cancelAnimationFrame(tween_raf);
	});

	let lookAt = getContext('lookAt');

	$effect(() => {
		if (!BROWSER) return;

		let to_check = {
            x: shown.x,
            y: shown.y,
            width: shown.width,
            height: shown.height,
            depth: depth,
            reference_width: Decimal(reference_width),
            camera: $camera,
            camera_refs : [$camera.x, $camera.y, $camera.scale, $camera.w, $camera.h]
        };
		if(!compare(to_check, previous_to_check)) {
			// console.log('Evaluating coords: ' + JSON.stringify(to_check, null, ' '));
			evaluated = evaluateCoords(to_check);
			// console.log("Got: " + JSON.stringify(evaluated, null, ' '));
			if(evaluated.visible) {
				let factor = evaluated.screen_width.div(evaluated.tgt_width);
				let factor_height = evaluated.screen_height.div(evaluated.tgt_height);
				let ratio = Decimal.min(factor, factor_height);
				// console.log("Factor: " + factor);
				// console.log([reference_width, evaluated.tgt_width.toNumber()]);
				$frame = {...to_check, factor: factor, ratio: ratio};
				current_style = "position:absolute;top:0px;left:0px;overflow:hidden;box-sizing:border-box;transform:" + evaluated.transform + ";width:" + evaluated.tgt_width.toNumber() + "px;height:" + evaluated.tgt_height.toNumber() + "px;z-index:" + evaluated.depth.toNumber() + (pointer_events ? ";pointer-events:" + pointer_events : "");
				if(debug) {
					current_style += ";border:dashed rgba(0,0,0,0.4) "+(2/factor)+"px;";
				}
			} else {
				current_style = "display:none;";
			}
			previous_to_check = to_check;
		}
	});

</script>
{#if evaluated && evaluated.visible}
	<div style={current_style}>
		{#if debug}
			<pre style="position:absolute;color:black;pointer-events:none;">{JSON.stringify($frame, null, ' ')}</pre>
		{/if}
		<!-- <pre>{JSON.stringify(evaluated, null, '  ')}</pre> -->
		<!-- {#if debug}
			<div
				style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;border:solid rgba(0,0,0,0.2) 1px;transform:translate(2%,70%);border-radius:3px;padding:11px;"
			>
				x: {Math.round(x)}, y: {Math.round(y)}<br />{Math.round(width)} x {Math.round(height)}
			</div>
		{/if} -->
		{@render children?.()}
	</div>
	{@render positionable?.()}
{/if}
