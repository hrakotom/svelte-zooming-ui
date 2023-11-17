<script>
	import { onMount, onDestroy, getContext } from 'svelte'; // Lifecycle hooks ( cycle de vie du composant : onMount = au montage du composant, onDestroy = au démontage du composant)
	import { fade } from 'svelte/transition'; // Transitions
	import { BROWSER } from 'esm-env';
	import Decimal from 'decimal.js'; // Librairie pour les calculs avec des décimales ( très larges )
	import { ui_store, positionable, evaluateCoords } from '$lib/utils.js'; // Utilitaires
	import compare from 'just-compare'; // Outil de comparaison d'objets ( deep )

	export let x, y, width, height, depth, reference_width = 500;

	let params = null;
	let evaluated = null;

    let zuid = getContext("zui-id");
    let tmp_ui_store = getContext("zui-store");
    // let ui_store = $tmp_ui_store[zuid];


    onMount(function(){
        console.log("ZUI-ID="+zuid);
        // console.log("ZUI-STORE: " + $ui_store);
    })

	// Exemple de gestion d'evenement click
	function clickIt(evt) {
		evt.stopPropagation();
		console.log('Click event');

		focusOn(x, y, width, height, 800, null, 0.97);
	}

	$: if ($ui_store.world && $ui_store.world[zuid] && $ui_store.world[zuid].camera) {
		let to_check = {
			x: x,
			y: y,
			width: width,
			height: height,
			depth: depth,
			reference_width: reference_width,
			camera: $ui_store.world[zuid].camera,
			camera_refs: [
				$ui_store.world[zuid].camera.x,
				$ui_store.world[zuid].camera.y,
				$ui_store.world[zuid].camera.scale,
				$ui_store.world[zuid].camera.w,
				$ui_store.world[zuid].camera.h
			],
			extra_style: 'background-color:rgba(255,255,255,0.8);border:solid red 1px;'
		};

		if (!compare(to_check, params)) {
			console.log("Evaluating coords");
			// Affectation pour s'assurer que les parties réactives du composant sont bien mises à jour
			params = to_check;
			evaluated = evaluateCoords(to_check);
		}
	}
</script>

<!-- S'affiche uniquement si l'objet est visible a l'oeil nu ET qu'il ne soit pas trop grand -->
<!-- {#if BROWSER && evaluated && evaluated.ratio > 0.1 && evaluated.ratio < 100} -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div use:positionable={params} in:fade class="">Hello there</div>
<!-- {/if} -->
