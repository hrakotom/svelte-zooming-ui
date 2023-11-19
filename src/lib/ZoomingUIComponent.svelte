<script>
	import { onMount, onDestroy, createEventDispatcher, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { BROWSER } from 'esm-env';
	import { notify, uuid4, positioned } from '$lib//utils.js';
	import Decimal from 'decimal.js';
	import lodash from 'lodash';
	import interact from 'interactjs';
    import anime from "animejs";
	
	// Setup bound dimensions and positions
	let width = null,
		height = null,
		x = null,
		y = null;

	let id = 'zui-' + uuid4();
	let resizes = 0;

	let screen = writable({
		x: Decimal(0),
		y: Decimal(0),
		w: Decimal(0),
		h: Decimal(0)
	});
	setContext('screen', screen);

	// TODO : evaluate context api to pass down variables like : clientWidth and clientHeight ( and uuid of root zui ? )

	onMount(() => {
	});

    onDestroy(() => {
	});

	function getScreenPosition(node) {
		if (node) {
			let rect = node.getBoundingClientRect();
			return {
				x: Decimal(rect.x),
				y: Decimal(rect.y),
				w: Decimal(rect.width),
				h: Decimal(rect.height)
			};
		}
	}


</script>

<div
	{id}
	style="position:absolute;box-sizing:border-box;border:solid red 1px;width:100%;height:100%;top:0px;left:0px;"
		use:positioned={[screen, getScreenPosition]}
	>
		<pre>
			{ JSON.stringify($screen, null, ' ') }
		</pre>
	<div
		style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;"
	>
		{width} x {height}
	</div>
	<slot />
</div>
