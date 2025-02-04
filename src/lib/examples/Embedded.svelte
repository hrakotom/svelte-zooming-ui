<script>
	/**
	 * Embedded component that can be interacted with to focus on a specific area.
	 * It responds to click events by logging the frame details and invoking a focus action.
	 * This component is typically used to embed interactive elements within a larger scene.
	 * @component
	 */
    import { getContext, onMount } from "svelte";
    import Positionable from '$lib/Positionable.svelte';
    import Decimal from 'decimal.js';

    export let bgcolor = "red";

    /** @type {function} Focus method obtained from context to handle click action. */
    let focus = getContext("focusOn");
    /** @type {object} Frame object obtained from context representing the component's frame. */
    let frame = getContext("frame");

    /**
     * Handles click events on the component.
     * @param {MouseEvent} evt - The mouse event object.
     * @fires focus - Invokes the focus function with a quarter of the frame's coordinates and dimensions.
     */
    function clicked(evt) {
        console.log("Clicked: " + JSON.stringify($frame));
        focus($frame.x.plus($frame.width.div(4)), $frame.y.plus($frame.height.div(4)), $frame.width.div(4), $frame.height.div(4));
    }
</script>
{#if $frame.factor && $frame.factor.greaterThan(0.4)}
<Positionable x={$frame.x.plus($frame.width.div(4))} y={$frame.y.plus($frame.height.div(4))} width={$frame.width.div(4)} height={$frame.height.div(4)} depth={Decimal(2)}>
    <div style="background-color:rgba(0,0,0,0.5);color:white;width:100%;height:100%;font-weight:400;font-family:Courier Prime;display:flex;justify-content:center;align-items:center;font-size:61px;cursor:pointer;border-radius:4%;" on:click={clicked}>Embedded</div>
</Positionable>
<Positionable x={$frame.x.plus($frame.width.div(4))} y={$frame.y.minus(2)} width={$frame.width.div(4)} height={$frame.height.div(4)} depth={Decimal(2)}>
    <div style="background-color:rgba(0,0,0,0.5);color:white;width:100%;height:100%;font-weight:400;font-family:Courier Prime;display:flex;justify-content:center;align-items:center;font-size:61px;cursor:pointer;border-radius:4%;text-align:center;" on:click={clicked}>Clicking me sends above.</div>
</Positionable>
{/if}
