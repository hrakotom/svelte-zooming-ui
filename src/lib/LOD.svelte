<script>
	/**
	 * LOD (Level of Detail) component that reacts to clicks by focusing on its frame.
	 * It displays or hides different items depending on the zoom level of the component.
	 * @component
	 */
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import Positionable from './Positionable.svelte';
	import LOD from './LOD.svelte';
	import Decimal from 'decimal.js';

	/** @type {function} Focus method obtained from context to handle click action. */
	let focus = getContext('focusOn');
	/** @type {object} Frame object obtained from context representing the component's frame. */
	let frame = getContext('frame');

	/**
	 * Handles click events on the component.
	 * @param {MouseEvent} evt - The mouse event object.
	 */
	function clicked(evt) {
		focus($frame.x, $frame.y, $frame.width, $frame.height);
	}
</script>

<Positionable
	x={$frame.x}
	y={$frame.y}
	width={$frame.width}
	height={$frame.height}
	depth={Decimal($frame.depth + 1)}
	debug={false}
>
	{#if $frame.ratio <= 10.0}
		<div
			style="width:100%;height:100%;background-color:rgba(96, 196, 109, 0.3);cursor:pointer;box-sizing:border-box;border-radius:11px;border:solid rgba(255,255,255,1.0) 1px;"
			on:click={clicked}
		>
			<div style="position:absolute;right:5px;top:5px;color:rgba(0, 0, 0, 0.6);z-index:1;font-size:8px;">
				{Math.round($frame.ratio * 100) / 100}
			</div>
		</div>
	{/if}
</Positionable>
{#if $frame.ratio >= 0.5}
	<Positionable
		x={$frame.x.minus($frame.width.div(4.1))}
		y={$frame.y.plus($frame.height.div(4.1))}
		width={$frame.width.div(2.2)}
		height={$frame.height.div(2.2)}
		depth={Decimal($frame.depth + 1)}
		debug={false}
	>
		<LOD slot="positionable" />
	</Positionable>
	<Positionable
		x={$frame.x.plus($frame.width.div(4.1))}
		y={$frame.y.plus($frame.height.div(4.1))}
		width={$frame.width.div(2.2)}
		height={$frame.height.div(2.2)}
		depth={Decimal($frame.depth + 1)}
		debug={false}
	>
		<LOD slot="positionable" />
	</Positionable>
	<Positionable
		x={$frame.x.minus($frame.width.div(4.1))}
		y={$frame.y.minus($frame.height.div(4.1))}
		width={$frame.width.div(2.2)}
		height={$frame.height.div(2.2)}
		depth={Decimal($frame.depth + 1)}
		debug={false}
	>
		<LOD slot="positionable" />
	</Positionable>
	<Positionable
		x={$frame.x.plus($frame.width.div(4.1))}
		y={$frame.y.minus($frame.height.div(4.1))}
		width={$frame.width.div(2.2)}
		height={$frame.height.div(2.2)}
		depth={Decimal($frame.depth + 1)}
		debug={false}
	>
		<LOD slot="positionable" />
	</Positionable>
{/if}
