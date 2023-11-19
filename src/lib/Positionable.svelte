<script>
	import { onMount, onDestroy, getContext } from 'svelte'; // Lifecycle hooks ( cycle de vie du composant : onMount = au montage du composant, onDestroy = au démontage du composant)
	import { fade } from 'svelte/transition'; // Transitions
	import { BROWSER } from 'esm-env';
	import Decimal from 'decimal.js'; // Librairie pour les calculs avec des décimales ( très larges )
	import {  } from '$lib/utils.js'; // Utilitaires
	import compare from 'just-compare'; // Outil de comparaison d'objets ( deep )

	export let x, y, width, height, depth, reference_width = 500;

	let params = null;
	let evaluated = null;

    let zuid = getContext("zui-id");


    onMount(function(){
        console.log("ZUI-ID="+zuid);
    })

	// Exemple de gestion d'evenement click
	function clickIt(evt) {
		evt.stopPropagation();
		console.log('Click event');
	}

</script>

<!-- S'affiche uniquement si l'objet est visible a l'oeil nu ET qu'il ne soit pas trop grand -->
<!-- {#if BROWSER && evaluated && evaluated.ratio > 0.1 && evaluated.ratio < 100} -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div use:positionable={params} in:fade class="">Hello there</div>
<!-- {/if} -->
