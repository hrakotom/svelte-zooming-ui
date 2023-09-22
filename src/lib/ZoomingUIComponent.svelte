<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { BROWSER } from 'esm-env';
	import { ui_store, notify, uuid4 } from '$lib//utils.js';
	import Decimal from 'decimal.js';
	import lodash from 'lodash';
	import interact from 'interactjs';

	export let verbose = false;

	// Setup bound dimensions
	let width = null,
		height = null;

	let id = 'zui-' + uuid4();
    let resizes = 0;

	// TODO : evaluate context api to pass down variables like : clientWidth and clientHeight ( and uuid of root zui ? )

	onMount(() => {
		console.log('Checking for ui store');
		if (!$ui_store.world || !$ui_store.world[id]) {
			$ui_store.world = $ui_store.world || {};
			$ui_store.world[id] = {};
		}
		// $ui_store._show_debug = true;
		$ui_store.world[id]._camera_animation = null;
		// initialize world data
		$ui_store.world[id].camera = {
			x: Decimal(0),
			y: Decimal(0),
			z: Decimal(0),
			scale: Decimal(1),
			w: Decimal(10000),
			h: Decimal(10000)
		};

		$ui_store.world[id]._tgt_camera = {
			x: Decimal(0),
			y: Decimal(0),
			z: Decimal(0),
			scale: Decimal(1),
			w: Decimal(10000),
			h: Decimal(10000)
		};

		notify('ZUI mounted : ' + JSON.stringify(Object.keys($ui_store)));
	});

	let resize = lodash.debounce(function (id, width, height) {
		// console.log("Actual resize call");

		try {
			$ui_store.world[id]._tgt_camera.w = $ui_store.world[id].camera.w = Decimal(width);
			$ui_store.world[id]._tgt_camera.h = $ui_store.world[id].camera.h = Decimal(height);
			$ui_store.world[id]._tgt_camera.fov = $ui_store.world[id].camera.fov = Decimal(
				(0.5 / Math.tan(Math.PI / 8)) * height
			);
			notify('window resized');
		} catch (e) {
			console.log('Error on window resize: ' + e);
		}
	}, 50);

	$: if(BROWSER){
	    console.log("Calling resize : " + resizes++);
        try {
            resize(id, width, height);
        } catch (e) {
            console.log("Error on window resize: " + e);
        }
	}
	$: if (BROWSER && $ui_store.world) {
		console.log('Current stores: ' + JSON.stringify(Object.keys($ui_store.world)));
	}

	onDestroy(() => {
        // console.log("In destroy hook");
		if ($ui_store && $ui_store.world && $ui_store.world[id]) {
			// console.log('Killing uid');
			delete $ui_store.world[id];
		}
	});

</script>

<div
	{id}
	style="position:absolute;box-sizing:border-box;border:solid red 1px;width:100%;height:100%;top:0px;left:0px;"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	<div
		style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;"
	>
		{width} x {height}
	</div>
	<slot />
</div>
