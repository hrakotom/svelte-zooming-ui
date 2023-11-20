<script>
	import { onMount, onDestroy, createEventDispatcher, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { BROWSER } from 'esm-env';
	import { uuid4, positionObserved } from '$lib//utils.js';
	import Decimal from 'decimal.js';
	import lodash from 'lodash';
	import interact from 'interactjs';
    import anime from "animejs";
	
	export let debug = false;

	let id = 'zui-' + uuid4();
	let resizes = 0;

	let previous_screen = null;

	let screen = writable({
		x: Decimal(0),
		y: Decimal(0),
		w: Decimal(0),
		h: Decimal(0)
	});

	let camera = writable({
		x: Decimal(0),
		y: Decimal(0),
		z: Decimal(0),
		scale: Decimal(1),
		w: Decimal(10000),
		h: Decimal(10000),
		fov: 0.0
	});

	setContext('screen', screen);
	setContext('camera', camera);

	onMount(() => {
	});

    onDestroy(() => {
	});

	let screenResized = lodash.debounce(function(){
		console.log("Screen dims change, reset camera");

		$camera.w 		= Decimal($screen.w);
		$camera.h 		= Decimal($screen.h);
		$camera.fov 	= Decimal((0.5 / Math.tan(Math.PI / 8)) * $screen.h);

	}, 50);


	// Reactive camera setup
	$: if(BROWSER) {
		let current_screen = JSON.stringify($screen);
		if(current_screen != previous_screen){
			previous_screen = current_screen;
			// console.log("Screen dims changed : " + JSON.stringify($screen, null, ' '));
			screenResized();
		}
	}

</script>

<div
	{id}
	style="position:absolute;box-sizing:border-box;border:solid red 1px;width:100%;height:100%;top:0px;left:0px;overflow:hidden;"
		use:positionObserved={screen}
	>
		<!-- debug: {debug} -->
	<slot />
	<!-- {#if debug}
		<div
			style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;border:solid rgba(0,0,0,0.2) 1px;transform:translate(2%,70%);border-radius:3px;padding:11px;"
		>
			x: {Math.round($screen.x)}, y: {Math.round($screen.y)}<br/>{Math.round($screen.w)} x {Math.round($screen.h)}
		</div>
	{/if} -->
</div>
