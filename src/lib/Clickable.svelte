<script>
    import { getContext } from "svelte";
    import { fade } from 'svelte/transition';

    export let bgcolor = "red";

    let focus = getContext("focusOn");
    let frame = getContext("frame");

    function clicked(evt) {
        console.log("Clicked: " + JSON.stringify($frame));
        focus($frame.x, $frame.y, $frame.width, $frame.height);
    }

</script>


<div style="width:100%;height:100%;background-color:{bgcolor};cursor:pointer;" on:click={clicked} in:fade>
    <slot></slot>
</div>