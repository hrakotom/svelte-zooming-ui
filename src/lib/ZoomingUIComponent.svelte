<script>
	import { onMount, onDestroy, createEventDispatcher, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { BROWSER } from 'esm-env';
	import { uuid4, positionObserved } from '$lib//utils.js';
	import Decimal from 'decimal.js';
	import lodash from 'lodash';
	import interact from 'interactjs';
	import anime from 'animejs';

	export let debug = false;

	let id = 'zui-' + uuid4();
	let tween_camera = null;

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
	let dispatch = createEventDispatcher();

	setContext('screen', screen);
	setContext('camera', camera);
	setContext('zui', id);
	setContext('lookAt', lookAt);
	setContext('focusOn', focusOn);

	function focusOn(x, y, w, h, duration, easing, ratio) {
		var tgt_scale = 1;
		if (duration === null || duration === void 0) duration = 500;
		if (easing === null || easing === void 0) easing = 'easeInOutCubic';

		var scale = ratio || 0.8;
		scale = Decimal(scale);

		var wratio = $camera.h.dividedBy($camera.w);
		var oratio = h.dividedBy(w);

		if (wratio.gte(oratio)) {
			tgt_scale = scale.div(w).div(wratio).times($camera.h);
		} else {
			tgt_scale = scale.dividedBy(h).times($camera.h);
		}
		lookAt(x, y, tgt_scale, duration, easing);
	}

	onMount(() => {
		let holder = {};

		// console.log("interacting with zui");
		interact('#' + id)
			.on('tap', function (e) {
				var taps = 1;

				if (holder['data-tapcancel']) {
					clearTimeout(holder['data-tapcancel']);
					holder['data-tapcount'] += 1;
				} else {
					holder['data-tapcount'] = 1;
				}
				holder['data-tapcancel'] = setTimeout(function () {
					if (holder['data-taphold']) {
						//notify("hold event, ignoring tap");
					} else {
						if (e.target.id == id) {
							dispatch('background-tap', {
								taps: holder['data-tapcount'],
								source: id
							});
							// window.evt = e;
						}
					}

					delete holder['data-tapcount'];
					delete holder['data-tapcancel'];
					delete holder['data-taphold'];
				}, 200);
			})
			.on('hold', function (evt) {
				holder['data-taphold'] = true;

				if (evt.touches && evt.touches.length != 1) return;
				if (
					evt.originalEvent &&
					evt.originalEvent.pointerType == 'mouse' &&
					evt.originalEvent.button == 2
				) {
					console.log('Ignoring right click hold event: ' + evt.originalEvent.button);
					return;
				}

				// window.evt = evt;

				evt.stopPropagation();
				evt.preventDefault();

				// We'll see later if we need to do this
				// if (world.ZOOMING || world.PANNING || $ui_store.app.devMode) return;

				dispatch('background-hold', {
					source: id
					// Might need other params
				});
			})
			.on('up', function (evt) {
				dispatch('background-hold-stop', {
					source: id
					// Might need other params
				});
			})
			.draggable({
				inertia: true,
				listeners: {
					start: function (evt) {
						evt.preventDefault();
						evt.stopPropagation();
					},
					move: dragMoveListener
				}
			})
			.on('draginertiastart', function (evt) {
				//console.log("Heard drag inertia start: " + evt.speed);
				if (evt.speed > 2000) {
					// We consider this a swipe event
					$screen._container_swipe = true;
				} else {
					$screen._container_swipe = false;
				}
			})
			.on(
				'onmousewheel' in document ? 'mousewheel' : 'wheel',
				lodash.throttle(
					function (evt) {
						// console.log("Hearing mousewheel event: " + evt.deltaY + " (" + evt.deltaMode + ")");

						if (evt.deltaY && Math.abs(evt.deltaY) < 1) return;

						var factor = Math.pow(0.99, 2);
						factor = Math.pow(0.6, 2);

						var direction = evt.detail < 0 || evt.wheelDelta > 0 || evt.deltaY < 0 ? 1 : -1;

						if (direction > 0) {
							factor = 1 / factor;
						} else if (direction < 0) {
							factor = factor;
						} else {
							return;
						}

						var dx = Decimal(evt.clientX)
								.minus($screen.x)
								.minus($camera.w.dividedBy(2))
								.times(factor - 1),
							dy = Decimal(evt.clientY)
								.minus($screen.y)
								.minus($camera.h.dividedBy(2))
								.times(factor - 1);

						lookAt(
							$camera.x.plus(dx.dividedBy($camera.scale).dividedBy(factor)),
							$camera.y.minus(dy.dividedBy($camera.scale).dividedBy(factor)),
							$camera.scale.times(factor),
							800,
							'linear'
						);
					},
					200,
					{ trailing: false }
				)
			)
			.gesturable({
				onmove: function (event) {
					try {
						$camera.scale = $camera.scale.times(1 + event.ds);

						event.preventDefault();
						event.stopPropagation();

						dragMoveListener(event);
					} catch (e) {
						notify('Error while gesturing: ' + e, 'error');
					}
				}
			})
			.styleCursor(false);
	});

	onDestroy(() => {});

	let screenResized = lodash.debounce(function () {
		console.log('Screen dims change, reset camera');

		$camera.w = Decimal($screen.w);
		$camera.h = Decimal($screen.h);
		$camera.fov = Decimal((0.5 / Math.tan(Math.PI / 8)) * $screen.h);
	}, 500);

	let screenResizedImmediate = function () {
		console.log('Screen dims change, reset camera (immediate)');

		$camera.w = Decimal($screen.w);
		$camera.h = Decimal($screen.h);
		$camera.fov = Decimal((0.5 / Math.tan(Math.PI / 8)) * $screen.h);
	};

	// Reactive camera setup
	$: if (BROWSER) {
		let current_screen = JSON.stringify($screen);
		if (current_screen != previous_screen) {
			// console.log("Screen dims changed : " + JSON.stringify($screen, null, ' '));
			screenResized();
			previous_screen = current_screen;
		}
	}

	function lookAt(x, y, scale, duration, easing) {
		// console.log(id + ': Camera is moving: ' + JSON.stringify([x, y, scale], null, ' '));

		var param = null;
		if (duration === null || duration === undefined) duration = 300;
		if (easing === null || easing === undefined) easing = 'easeInOutCubic';

		if (typeof x == 'object' && !(x instanceof Decimal)) {
			param = x;
		} else {
			param = {
				x: x,
				y: y,
				scale: scale
			};
		}

		['x', 'y', 'scale'].forEach(function (item) {
			if (!(param[item] instanceof Decimal)) param[item] = Decimal(param[item]);
			// $ui_store.world._tgt_camera[item] = param[item];
		});

		if (tween_camera) {
			tween_camera.pause();
			tween_camera = null;
		}

		// Calculate current z
		if ($camera.fov === undefined) {
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
				$camera.x = initial.x.plus(dx.times(o.value));
				$camera.y = initial.y.plus(dy.times(o.value));
				$camera.z = initial.z.plus(dz.times(o.value));
				if ($camera.fov === undefined) {
					$camera.fov = Decimal((0.5 / Math.tan(Math.PI / 8)) * $camera.h);
				}
				$camera.scale = $camera.fov.dividedBy($camera.z);
			},
			complete: function (anim) {
				tween_camera = null;
				// console.log(id + ': Camera has finished moving');
			}
		});
	}

	function dragMoveListener(event) {
		if (tween_camera) {
			tween_camera.pause();
			tween_camera = null;
		}

		$camera.x = $camera.x.minus(Decimal(event.dx).dividedBy($camera.scale));
		$camera.y = $camera.y.plus(Decimal(event.dy).dividedBy($camera.scale));

		event.stopPropagation();
		event.preventDefault();

		// message = "Moving: " + [event.dx, event.dy, event.ds];
		// world.setPanning();
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
