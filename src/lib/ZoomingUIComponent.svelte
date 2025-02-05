<svelte:options accessors />

<script>
	/**
	 * A Svelte component that provides a zoomable user interface (ZUI) functionality.
	 * It allows elements within the container to be zoomed in and out and to be focused upon.
	 * This component handles user interactions such as tap, hold, drag, and mouse wheel events
	 * to manipulate the view of the ZUI.
	 *
	 * @component
	 * @prop {boolean} debug - Enables debug mode which provides additional visual output.
	 */
	import { onMount, onDestroy, createEventDispatcher, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { BROWSER } from 'esm-env';
	import { uuid4, positionObserved, adjustDecimalPrecision } from '$lib/utils.js';
	import Decimal from 'decimal.js';
	import lodash from 'lodash';
	import interact from 'interactjs';
	import anime from 'animejs';
	import compare from 'just-compare';

	/**
	 * Toggles the debug mode for the component, providing additional visual output.
	 * @type {boolean}
	 */
	export let debug = false;

	let containerElement;
	let totalElementCount = 0;
	let previous_to_check = null;

	// Function to recursively count all child elements
	function countAllChildElements(element) {
		let count = element.children.length;
		for (let child of element.children) {
			count += countAllChildElements(child);
		}
		return count;
	}

	let debouncedCountAllChildElements = lodash.debounce(function () {
		if (!containerElement) return;
		if (debug) console.log('Counting the suckers');
		totalElementCount = countAllChildElements(containerElement);
	}, 1500);

	let id = 'zui-' + uuid4();
	let tween_camera = null;

	let previous_screen = null;

	const screen = writable({
		x: Decimal(0),
		y: Decimal(0),
		w: Decimal(0),
		h: Decimal(0)
	});

	const camera = writable({
		x: Decimal(0),
		y: Decimal(0),
		z: Decimal(0),
		scale: Decimal(1),
		w: Decimal(10000),
		h: Decimal(10000),
		fov: Decimal(0.0)
	});
	let dispatch = createEventDispatcher();

	// Reactive statement to count all child elements
	$: if (BROWSER && containerElement) {
		totalElementCount = countAllChildElements(containerElement);

		let to_check = {
			x: $screen.x,
			y: $screen.y,
			width: $screen.w,
			height: $screen.h,
			camera: $camera,
			camera_refs: [$camera.x, $camera.y, $camera.scale, $camera.w, $camera.h]
		};

		if (!compare(to_check, previous_to_check)) {
			debouncedCountAllChildElements();

			previous_to_check = to_check;
		}
	}

	/**
	 * Focuses the camera on a specified rectangle area within the ZUI.
	 * The view is smoothly transitioned to center on the given rectangle.
	 *
	 * @param {Decimal|number} x - The x-coordinate of the top-left corner of the rectangle.
	 * @param {Decimal|number} y - The y-coordinate of the top-left corner of the rectangle.
	 * @param {Decimal|number} w - The width of the rectangle.
	 * @param {Decimal|number} h - The height of the rectangle.
	 * @param {number} [duration=500] - The duration of the focus animation in milliseconds.
	 * @param {string} [easing='easeInOutCubic'] - The easing function to use for the transition.
	 * @param {Decimal|number} [ratio=0.8] - The ratio of the screen that the rectangle should occupy.
	 */
	export const focusOn = function (x, y, w, h, duration, easing, ratio) {
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
	};

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

	onDestroy(() => {
		if (BROWSER) {
			// Clean up interact instance
			interact('#' + id).unset();
		}
	});

	let screenResized = lodash.debounce(function () {
		if (debug) console.log('Screen dims change, reset camera');

		$camera.w = Decimal($screen.w);
		$camera.h = Decimal($screen.h);
		$camera.fov = Decimal((0.5 / Math.tan(Math.PI / 8)) * $screen.h);
	}, 0);

	let screenResizedImmediate = function () {
		if (debug) console.log('Screen dims change, reset camera (immediate)');

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

	/**
	 * Moves the camera to look at a specific point with a given scale.
	 *
	 * @param {Decimal|number} x - The x-coordinate to look at.
	 * @param {Decimal|number} y - The y-coordinate to look at.
	 * @param {Decimal|number} scale - The scale level to set the camera to.
	 * @param {number} [duration=300] - The duration of the camera movement in milliseconds.
	 * @param {string} [easing='easeInOutCubic'] - The easing function to use for the camera movement.
	 */
	export const lookAt = function (x, y, scale, duration, easing) {
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
	};

	export const getCameraAndScreen = function () {
		return { camera: $camera, screen: $screen };
	};

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

	// Provide context variables for child components

	/**
	 * The screen store contains the viewport dimensions and position
	 * @type {import('svelte/store').Writable<{x: Decimal, y: Decimal, w: Decimal, h: Decimal}>}
	 */
	setContext('screen', screen);

	/**
	 * The camera store contains the current view transformation state
	 * @type {import('svelte/store').Writable<{
	 *   x: Decimal,      // Camera x position
	 *   y: Decimal,      // Camera y position
	 *   z: Decimal,      // Camera z position (depth)
	 *   scale: Decimal,  // Current zoom scale
	 *   w: Decimal,      // Viewport width
	 *   h: Decimal,      // Viewport height
	 *   fov: Decimal     // Field of view
	 * }>}
	 */
	setContext('camera', camera);

	/**
	 * The unique ID of this ZoomingUI instance
	 * @type {string}
	 */
	setContext('zui', id);

	/**
	 * Function to programmatically move the camera
	 * @type {(x: Decimal|number, y: Decimal|number, scale: Decimal|number, duration?: number, easing?: string) => void}
	 */
	setContext('lookAt', lookAt);

	/**
	 * Function to focus the camera on a specific rectangle area
	 * @type {(x: Decimal|number, y: Decimal|number, w: Decimal|number, h: Decimal|number, duration?: number, easing?: string, ratio?: Decimal|number) => void}
	 */
	setContext('focusOn', focusOn);

	// Reactive statement to adjust precision
	$: if (BROWSER) {
		adjustDecimalPrecision($camera.scale);
	}
</script>

<div
	{id}
	style="position:absolute;box-sizing:border-box;border:solid red 0px;width:100%;height:100%;top:0px;left:0px;overflow:hidden;"
	use:positionObserved={screen}
	bind:this={containerElement}
>
	<!-- debug: {debug} -->
	<slot />
</div>
{#if debug}
	<div
		style="position:absolute;padding:5px;font-size:xx-small;bottom:5px;right:5px;font-family:Courier;border:solid rgba(0,0,0,0.2) 1px;border-radius:3px;padding:11px;box-suzing:border-box;background-color:rgba(255,255,255,0.8);z-index:1000;"
	>
		x: {Math.round($screen.x)}, y: {Math.round($screen.y)}<br />{Math.round($screen.w)} x {Math.round(
			$screen.h
		)}
		<br />Elements: {totalElementCount}
		<br />Scale: {$camera.scale}
	</div>
{/if}
