<script>
	import { onMount, onDestroy, createEventDispatcher, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { BROWSER } from 'esm-env';
	import { notify, uuid4, positionObserved } from '$lib//utils.js';
	import Decimal from 'decimal.js';
	import lodash from 'lodash';
	import interact from 'interactjs';
    import anime from "animejs";
	
	let id = 'zui-' + uuid4();
	let resizes = 0;

	let screen = writable({
		x: Decimal(0),
		y: Decimal(0),
		w: Decimal(0),
		h: Decimal(0)
	});
	setContext('screen', screen);

	onMount(() => {
	});

    onDestroy(() => {
	});

</script>

<div
	{id}
	style="position:absolute;box-sizing:border-box;border:solid red 1px;width:100%;height:100%;top:0px;left:0px;"
		use:positionObserved={screen}
	>
		<pre style="font-family:'Courier New', Courier, monospace;font-size:10px;">
			{ JSON.stringify({x: Math.round($screen.x), y: Math.round($screen.y), width: Math.round($screen.w), height: Math.round($screen.h)}, null, ' ') }
		</pre>
	<div
		style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;"
	>
		{Math.round($screen.w)} x {Math.round($screen.h)}
	</div>
	<slot />
</div>
