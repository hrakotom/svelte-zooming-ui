<script>
	import { onMount, onDestroy, getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { BROWSER } from 'esm-env';
	import Decimal from 'decimal.js';
	import {} from '$lib/utils.js';
	import compare from 'just-compare';

	export let x,
		y,
		width,
		height,
		depth,
		reference_width = 500;
		
	export let debug = false;

	let params = null;
	let evaluated = null;

	let zuid = getContext('zui-id');

	onMount(function () {
		console.log('ZUI-ID=' + zuid);
	});

	// Exemple de gestion d'evenement click
	function clickIt(evt) {
		evt.stopPropagation();
		console.log('Click event');
	}
</script>

<div style="position:absolute;border:solid red 1px;">
	{#if debug}
		<div
			style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;border:solid rgba(0,0,0,0.2) 1px;transform:translate(2%,70%);border-radius:3px;padding:11px;"
		>
			x: {Math.round(x)}, y: {Math.round(y)}<br />{Math.round(width)} x {Math.round(height)}
		</div>
	{/if}
	<slot />
</div>
