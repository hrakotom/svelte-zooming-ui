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
	let tween_camera= null;

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
		fov: Decimal(0.0)
	});

	setContext('screen', screen);
	setContext('camera', camera);
	setContext('zui', id);
	setContext('lookAt', lookAt);

	onMount(() => {
		//screenResizedImmediate();
	});

    onDestroy(() => {
	});

	let screenResized = lodash.debounce(function(){
		console.log("Screen dims change, reset camera");

		$camera.w 		= Decimal($screen.w);
		$camera.h 		= Decimal($screen.h);
		$camera.fov 	= Decimal((0.5 / Math.tan(Math.PI / 8)) * $screen.h);

	}, 500);

	let screenResizedImmediate = function(){
		console.log("Screen dims change, reset camera (immediate)");

		$camera.w 		= Decimal($screen.w);
		$camera.h 		= Decimal($screen.h);
		$camera.fov 	= Decimal((0.5 / Math.tan(Math.PI / 8)) * $screen.h);

	}


	// Reactive camera setup
	$: if(BROWSER) {
		let current_screen = JSON.stringify($screen);
		if(current_screen != previous_screen){
			// console.log("Screen dims changed : " + JSON.stringify($screen, null, ' '));
			screenResized();
			previous_screen = current_screen;
		}
	}

	function lookAt(x, y, scale, duration, easing) {

		console.log(id + ": Camera is moving: " + JSON.stringify([x,y,scale], null, ' '));

		var param = null;
		if(duration === null || duration === undefined) duration = 300;
		if(easing === null || easing === undefined) easing = 'easeInOutCubic';

		if (typeof(x) == "object" && !(x instanceof Decimal)) {
			param = x;
		} else {
			param = {
				x: x,
				y: y,
				scale: scale
			};
		}

		["x", "y", "scale"].forEach(function(item){
			if(!(param[item] instanceof Decimal))
				param[item] = Decimal(param[item]);
			// $ui_store.world._tgt_camera[item] = param[item];
		});

		if(tween_camera) {
			tween_camera.pause();
			tween_camera = null;
		}

		// Calculate current z
		if($camera.fov === undefined) {
			$camera.fov = Decimal((0.5 / Math.tan(Math.PI / 8)) * $camera.h);
		}
		$camera.z = $camera.fov.dividedBy($camera.scale);

		var initial = {
			x: Decimal($camera.x),
			y: Decimal($camera.y),
			z: Decimal($camera.z)
		};

		var dx = param.x.minus(initial.x),
			dy = param.y.minus(initial.y),
			dz = $camera.fov.dividedBy(param.scale).minus(initial.z);

		var o = { value: 0 };

		tween_camera = anime({
			targets: o,
			value: 1,
			easing: easing,
			duration: duration,
			update: function (anim) {
				$camera.x     = initial.x.plus(dx.times(o.value));
				$camera.y     = initial.y.plus(dy.times(o.value));
				$camera.z     = initial.z.plus(dz.times(o.value));
				if($camera.fov === undefined) {
					$camera.fov = Decimal((0.5 / Math.tan(Math.PI / 8)) * $camera.h);	
				}
				$camera.scale = $camera.fov.dividedBy($camera.z);
			},
			complete: function(anim){
				tween_camera = null;
				console.log(id + ": Camera has finished moving");
			}
		});

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
