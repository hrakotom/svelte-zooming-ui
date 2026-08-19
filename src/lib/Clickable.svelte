<script>
	/**
	 * Clickable component that can be used to make an area interactive within the zoomable UI.
	 * It responds to click events by invoking a focus action to center the view on itself, facilitating user interaction.
	 * This component is typically used to create buttons or interactive areas that require user engagement.
	 * @component
	 */
    import { getContext } from "svelte";

    /** @type {{ bgcolor?: string, children?: import('svelte').Snippet }} */
    let { bgcolor = "red", children } = $props();

    let focus = getContext("focusOn");
    let frame = getContext("frame");

    function clicked(evt) {
        //console.log("Clicked: " + JSON.stringify($frame));
        focus($frame.x, $frame.y, $frame.width, $frame.height);
    }

</script>


<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div style="width:100%;height:100%;background-color:{bgcolor};cursor:pointer;border:solid rgba(0,0,0,1) 0px;box-sizing:border-box;" onclick={clicked}>
    {@render children?.()}
</div>
