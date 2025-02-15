<script>
	/**
	 * Clickable component that can be used to make an area interactive within the zoomable UI.
	 * It responds to click events by invoking a focus action to center the view on itself, facilitating user interaction.
	 * This component is typically used to create buttons or interactive areas that require user engagement.
	 * @component
	 */
    import { getContext } from "svelte";

    export let bgcolor = "red";

    let focus = getContext("focusOn");
    let frame = getContext("frame");

    function clicked(evt) {
        //console.log("Clicked: " + JSON.stringify($frame));
        focus($frame.x, $frame.y, $frame.width, $frame.height);
    }

</script>


<div style="width:100%;height:100%;background-color:{bgcolor};cursor:pointer;border:solid rgba(0,0,0,1) 0px;box-sizing:border-box;" on:click={clicked}>
    <slot></slot>
</div>
