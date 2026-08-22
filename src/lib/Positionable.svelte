<script>
	/**
	 * Positionable component that represents an element with a specific position and size within the zoomable UI.
	 * It calculates its visibility and transformation based on the camera's view and updates
	 * its style accordingly. It also provides a frame context for child components to align themselves within the UI.
	 * This component is essential for positioning and rendering elements at the correct scale and position.
	 * @component
	 */
	import { onMount, onDestroy, getContext, setContext } from 'svelte';
	import { BROWSER } from 'esm-env';
	import Decimal from 'decimal.js';
	import { evaluateCoords } from '$lib/utils.js';
	import compare from 'just-compare';
	import { writable } from 'svelte/store';

	/**
	 * @type {{ x: any, y: any, width: any, height: any, depth: any, reference_width?: number,
	 *          debug?: boolean, pointer_events?: string | null,
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
		children,
		positionable
	} = $props();

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
		$frame.x = x;
		$frame.y = y;
		$frame.width = width;
		$frame.height = height;
		$frame.depth = depth;
	});

	onMount(function () {
		// console.log("Props: " + JSON.stringify(Object.keys($$props), null, ' '));
	});

	let lookAt = getContext('lookAt');

	$effect(() => {
		if (!BROWSER) return;

		let to_check = {
            x: x,
            y: y,
            width: width,
            height: height,
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
