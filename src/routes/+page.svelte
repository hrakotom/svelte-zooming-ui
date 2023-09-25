<script>
    import { BROWSER } from 'esm-env';
    import ZUI from '$lib/ZoomingUIComponent.svelte';
    import { ui_store } from '$lib//utils.js';

    let verbose = true;

    function handleZuiNotification(event) {
        console.log("ZUI notification: " + event.detail);
    }
    $: if(BROWSER) {
        if($ui_store && $ui_store.notifications && $ui_store.notifications.length > 0) {
            if(!verbose) {
                $ui_store.notifications = [];
            } else {
                while($ui_store.notifications.length > 0) {
                    console.log("INFO: " + $ui_store.notifications.shift().message);
                }
            }
        }
    }

</script>

<div style="border:solid green 2px;width:25%;height:50%;transform:translate(-50%,-50%);top:50%;left:75%;position:absolute;">
    <ZUI on:zui-notification={handleZuiNotification}/>
</div>
<div style="border:solid blue 2px;width:25%;height:50%;transform:translate(-50%,-50%);top:50%;left:25%;position:absolute;">
    <ZUI on:zui-notification={handleZuiNotification}/>
</div>
