<script>
    import { onMount, onDestroy } from 'svelte';
    import interact from 'interactjs';

    // Setup bound dimensions
    let width = null, height = null;

    let id = "zui-" + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

    // TODO : evaluate context api to pass down variables like : clientWidth and clientHeight ( and uuid of root zui ? )

    onMount(() => {
        const event = new CustomEvent('zui-notification', { detail: 'ZUI mounted' });
        document.dispatchEvent(event);
    });



</script>


<div id={id} style="position:absolute;box-sizing:border-box;border:solid red 1px;width:100%;height:100%;top:0px;left:0px;" bind:clientWidth={width} bind:clientHeight={height}>
    <div style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;">{width} x {height}</div>
    <slot></slot>
</div>
