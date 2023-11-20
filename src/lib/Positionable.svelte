<script>
	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { BROWSER } from 'esm-env';
	import Decimal from 'decimal.js';
	import { evaluateCoords } from '$lib/utils.js';
	import compare from 'just-compare';

	export let x,
		y,
		width,
		height,
		depth,
		reference_width = 500;

	export let debug = false;

	let params = null;
	let evaluated = null;

	let camera = getContext('camera');
	let current_style = "display:none;";

	onMount(function () {
		console.log("Props: " + JSON.stringify(Object.keys($$props), null, ' '));
	});

	$: if(BROWSER) {
		
		let to_check = {
            x: x,
            y: y,
            width: width,
            height: height,
            depth: depth,
            reference_width: reference_width,
            camera: $camera,
            camera_refs : [$camera.x, $camera.y, $camera.scale, $camera.w, $camera.h]
        };
		// if(!compare(to_check, params)) {
		// 	console.log('Evaluating coords');
		// 	params = to_check;
		// 	evaluated = evaluateCoords(to_check);
		// }
		evaluated = evaluateCoords(to_check);

		current_style = "position:absolute;top:0px;left:0px;transform:" + evaluated.transform + ";width:" + evaluated.tgt_width.toNumber() + "px;height:" + evaluated.tgt_height.toNumber() + "px;z-index:" + evaluated.depth.toNumber() + ";border:solid blue 1px;overflow:hidden;";

	}
</script>

<div style={current_style}>
	<!-- <pre>{JSON.stringify(evaluated, null, '  ')}</pre> -->
	{#if debug}
		<div
			style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;border:solid rgba(0,0,0,0.2) 1px;transform:translate(2%,70%);border-radius:3px;padding:11px;"
		>
			x: {Math.round(x)}, y: {Math.round(y)}<br />{Math.round(width)} x {Math.round(height)}
		</div>
	{/if}
	<slot />
</div>
