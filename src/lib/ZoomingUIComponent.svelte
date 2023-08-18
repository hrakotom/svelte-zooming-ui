<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { browser } from '$app/environment';
    import { ui_store, notify } from '$lib//utils.js';
    import interact from 'interactjs';
    
    export let verbose = false;

    // Setup bound dimensions
    let width = null, height = null;

    let id = "zui-" + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

    // TODO : evaluate context api to pass down variables like : clientWidth and clientHeight ( and uuid of root zui ? )

    onMount(() => {
        notify("ZUI mounted");
        console.log($ui_store.notifications);
    });

    $: if(browser) {
        if($ui_store && $ui_store.notifications && $ui_store.notifications.length > 0) {
            if(!verbose) {
                $ui_store.notifications = [];
            } else {
                while($ui_store.notifications.length > 0) {
                    console.log($ui_store.notifications.shift());
                }
            }
        }
    }


</script>


<div id={id} style="position:absolute;box-sizing:border-box;border:solid red 1px;width:100%;height:100%;top:0px;left:0px;" bind:clientWidth={width} bind:clientHeight={height}>
    <div style="position:absolute;padding:5px;font-size:xx-small;bottom:-20px;right:1px;font-family:Courier;">{width} x {height}</div>
    <slot></slot>
</div>
