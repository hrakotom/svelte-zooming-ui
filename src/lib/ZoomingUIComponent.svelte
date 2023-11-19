<script>
	import { onMount, onDestroy, createEventDispatcher, setContext } from 'svelte';
	import { BROWSER } from 'esm-env';
	import { ui_store, notify, uuid4 } from '$lib//utils.js';
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

	// TODO : evaluate context api to pass down variables like : clientWidth and clientHeight ( and uuid of root zui ? )

	onMount(() => {
        notify("Setting up variables");
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
        notify("Setting up lookAt");
		// Add camera lookAt functionality
		$ui_store.lookAt = $ui_store.lookAt || function (id, x, y, scale, duration, easing) {
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
				$ui_store.world[id]._tgt_camera[item] = param[item];
			});

			if ($ui_store.world[id]._tween_camera) {
				$ui_store.world[id]._tween_camera.pause();
				delete $ui_store.world[id]._tween_camera;
			}

			// Calculate current z
			if ($ui_store.world[id].camera.fov === undefined) {
				$ui_store.world[id].camera.fov = Decimal(
					(0.5 / Math.tan(Math.PI / 8)) * $ui_store.world[id].camera.h
				);
			}
			$ui_store.world[id].camera.z = $ui_store.world[id].camera.fov.dividedBy($ui_store.world[id].camera.scale);

			var initial = {
				x: Decimal($ui_store.world[id].camera.x),
				y: Decimal($ui_store.world[id].camera.y),
				z: Decimal($ui_store.world[id].camera.z)
			};

			var dx = param.x.minus(initial.x),
				dy = param.y.minus(initial.y),
				dz = $ui_store.world[id].camera.fov.dividedBy(param.scale).minus(initial.z);

			var o = { value: 0 };

			$ui_store.world[id]._tween_camera = anime({
				targets: o,
				value: 1,
				easing: easing,
				duration: duration,
				update: function (anim) {
					$ui_store.world[id].camera.x = initial.x.plus(dx.times(o.value));
					$ui_store.world[id].camera.y = initial.y.plus(dy.times(o.value));
					$ui_store.world[id].camera.z = initial.z.plus(dz.times(o.value));
					if ($ui_store.world[id].camera.fov === undefined) {
						$ui_store.world[id].camera.fov = Decimal(
							(0.5 / Math.tan(Math.PI / 8)) * $ui_store.world[id].camera.h
						);
					}
					$ui_store.world[id].camera.scale = $ui_store.world[id].camera.fov.dividedBy(
						$ui_store.world[id].camera.z
					);
				},
				complete: function (anim) {
					delete $ui_store.world[id]._tween_camera;
					console.log('Camera has fnished moving');
				}
			});
		};

        notify("Setting up interaciton");

        // intialize variables
        let self = this;
        let holder = {};

        interact('#'+id)
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
							if(e.target.id == "zui-container") {
								dispatch('background-tap', {
									taps: holder['data-tapcount']
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
					if(evt.originalEvent && evt.originalEvent.pointerType == "mouse" && evt.originalEvent.button == 2) {
						console.log("Ignoring right click hold event: " + evt.originalEvent.button);
						return;
					}

					// window.evt = evt;

					evt.stopPropagation();
					evt.preventDefault();

					// We'll see later if we need to do this
					// if (world.ZOOMING || world.PANNING || $ui_store.app.devMode) return;

					$ui_store.menu_open = {
						x: evt.pageX,
						y: evt.pageY
					};

					//notify('<b>H</b>old <b>E</b>vent!', 'success');
				})
				.on('up', function (evt) {
					// console.log('zui-container::up');
					// retrieve target element
					// window.evt = evt;
					if (evt.target && evt.target.dataset.menuTarget) {
						notify(
							'<b>M</b>enu selected :: <b>' + evt.target.dataset.menuTarget + '</b>',
							'success'
						);
						dispatch("menu-selection", evt.target.dataset.menuTarget);
					}
					$ui_store.menu_open = false;
				})
				.draggable({
					inertia: true,
					listeners: {
						start: function (evt) {
							evt.preventDefault();
							evt.stopPropagation();
						},
						move: dragMoveListener,
					}
				})
				.on('draginertiastart', function (evt) {
					//console.log("Heard drag inertia start: " + evt.speed);
					if (evt.speed > 2000) {
						// We consider this a swipe event
						$ui_store.world[id]._container_swipe = true;
					} else {
						$ui_store.world[id]._container_swipe = false;
					}
				})
				.on("onmousewheel" in document ? "mousewheel" : "wheel",
						lodash.throttle(function (evt) {
							
							// console.log("Hearing mousewheel event: " + evt.deltaY + " (" + evt.deltaMode + ")");

							if ($ui_store.menu_open) return;
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
									.minus($ui_store.world[id].camera.w.dividedBy(2))
									.times(factor - 1),
								dy = Decimal(evt.clientY)
									.minus($ui_store.world[id].camera.h.dividedBy(2))
									.times(factor - 1);

							// $ui_store.world._tgt_camera.x = $ui_store.world.camera.x = $ui_store.world._tgt_camera.x.plus(dx.dividedBy($ui_store.world._tgt_camera.scale).dividedBy(factor));
							// $ui_store.world._tgt_camera.y = $ui_store.world.camera.y = $ui_store.world._tgt_camera.y.minus(dy.dividedBy($ui_store.world._tgt_camera.scale).dividedBy(factor));
							// $ui_store.world._tgt_camera.scale = $ui_store.world.camera.scale = $ui_store.world._tgt_camera.scale.times(factor);

							$ui_store.lookAt(
								id,
								$ui_store.world[id]._tgt_camera.x.plus(dx.dividedBy($ui_store.world[id]._tgt_camera.scale).dividedBy(factor)),
								$ui_store.world[id]._tgt_camera.y.minus(dy.dividedBy($ui_store.world[id]._tgt_camera.scale).dividedBy(factor)),
								$ui_store.world[id]._tgt_camera.scale.times(factor),
								800,
								'linear'
							);



						},
						200,
						{ trailing: false })
				)
				.gesturable({
					onmove: function (event) {
						if ($ui_store.menu_open) return;

						try {

							$ui_store.world[id].camera.scale =  $ui_store.world[id].camera.scale.times(1 + event.ds);
							$ui_store.world[id]._tgt_camera.scale = Decimal($ui_store.world[id].camera.scale);

							event.preventDefault();
							event.stopPropagation();

							// world.setZooming();

							dragMoveListener(event);
						} catch (e) {
							notify('Error while gesturing: ' + e, 'error');
						}
					}
				})
				.styleCursor(false);


		notify('ZUI mounted : ' + JSON.stringify(Object.keys($ui_store.world[id])));
        $ui_store.lookAt(id, 0, 0, 1);
		window.world = $ui_store.world[id];
	});

	let resize = lodash.debounce(function (id, width, height) {
		// console.log("Actual resize call");
		try {
			$ui_store.world[id]._tgt_camera.w = $ui_store.world[id].camera.w = Decimal(width);
			$ui_store.world[id]._tgt_camera.h = $ui_store.world[id].camera.h = Decimal(height);
			$ui_store.world[id]._tgt_camera.fov = $ui_store.world[id].camera.fov = Decimal(
				(0.5 / Math.tan(Math.PI / 8)) * height
			);
			notify('component resized (' + ++resizes + ') : ' + width + ' x ' + height);
		} catch (e) {
			console.log('Error on window resize: ' + e);
		}
	}, 50);

	$: if (BROWSER) {
		// console.log("Calling resize : " + ++resizes);
		resize(id, width, height);
	}
	$: if (BROWSER && $ui_store.world) {
		console.log('Current stores: ' + JSON.stringify(Object.keys($ui_store.world)));
	}

	function dragMoveListener(event) {
		if ($ui_store.menu_open) {
			// notify("menu open, ignoring drag/move");
			return;
		}
		// if ($ui_store.app.devMode) return ;

		if($ui_store.world[id]._tween_camera) {
			$ui_store.world[id]._tween_camera.pause();
			delete($ui_store.world[id]._tween_camera);
		}


		$ui_store.world[id].camera.x = $ui_store.world[id]._tgt_camera.x = $ui_store.world[id].camera.x.minus(Decimal(event.dx).dividedBy($ui_store.world[id].camera.scale));
		$ui_store.world[id].camera.y = $ui_store.world[id]._tgt_camera.y = $ui_store.world[id].camera.y.plus(Decimal(event.dy).dividedBy($ui_store.world[id].camera.scale));

		event.stopPropagation();
		event.preventDefault();

		// message = "Moving: " + [event.dx, event.dy, event.ds];
		// world.setPanning();
	}


    onDestroy(() => {
		// console.log("In destroy hook");
		if ($ui_store && $ui_store.world && $ui_store.world[id]) {
			// console.log('Killing uid');
			delete $ui_store.world[id];
		}
	});

	setContext("zui-id", id);
	setContext("zui-store", ui_store);
</script>

<div
	{id}
	style="position:absolute;box-sizing:border-box;border:solid red 1px;width:100%;height:100%;top:0px;left:0px;"
	bind:clientWidth={width}
	bind:clientHeight={height}
>	{#if $ui_store.world && $ui_store.world[id] && $ui_store.world[id].camera}
		<!-- display a table with x,yz,scale -->
		<table>
			<tr>
				<td>x</td>
				<td>{$ui_store.world[id].camera.x.toFixed(2)}</td>
			</tr>
			<tr>
				<td>y</td>
				<td>{$ui_store.world[id].camera.y.toFixed(2)}</td>
			</tr>
			<tr>
				<td>z</td>
				<td>{$ui_store.world[id].camera.z.toFixed(2)}</td>
			</tr>
			<tr>
				<td>scale</td>
				<td>{$ui_store.world[id].camera.scale.toFixed(2)}</td>
			</tr>
		</table>
	{/if}
	<!-- x: {$ui_store.world[id].camera.x.toFixed(2)} y: {$ui_store.world[id].camera.y.toFixed(2)} z: {$ui_store.world[id].camera.z.toFixed(2)} scale: {$ui_store.world[id].camera.scale.toFixed(2)} -->
	<div
		style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;"
	>
		{width} x {height}
	</div>
	<slot />
</div>
