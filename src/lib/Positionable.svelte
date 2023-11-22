<script>
	import { onMount, onDestroy, getContext, setContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { BROWSER } from 'esm-env';
	import Decimal from 'decimal.js';
	import { evaluateCoords } from '$lib/utils.js';
	import compare from 'just-compare';
	import { writable } from 'svelte/store';

	export let x,
		y,
		width,
		height,
		depth,
		reference_width = 500;

	export let debug = false;

	let previous_to_check = null;
	let evaluated = null;

	let camera = getContext('camera');
	let current_style = "display:none;will-change:transform;";

	let frame = writable({});
	setContext('frame', frame);

	$: if (BROWSER) {
		$frame.x = x;
		$frame.y = y;
		$frame.width = width;
		$frame.height = height;
		$frame.depth = depth;
	}

	onMount(function () {
		// console.log("Props: " + JSON.stringify(Object.keys($$props), null, ' '));
	});

	let lookAt = getContext('lookAt');

	$: if(BROWSER) {
		
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
				// console.log("Factor: " + factor);
				// console.log([reference_width, evaluated.tgt_width.toNumber()]);
				$frame = {...to_check, factor: factor};
				current_style = "position:absolute;top:0px;left:0px;overflow:hidden;will-change:transform;box-sizing:border-box;transform:" + evaluated.transform + ";width:" + evaluated.tgt_width.toNumber() + "px;height:" + evaluated.tgt_height.toNumber() + "px;z-index:" + evaluated.depth.toNumber() ;
				if(debug) {
					current_style += ";border:dashed rgba(0,0,0,0.4) "+(2/factor)+"px;";
				}
			} else {
				current_style = "display:none;will-change:transform;";
			}
			previous_to_check = to_check;
		}

	}

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
		<slot />
	</div>
	<slot name="positionable" />
{/if}
