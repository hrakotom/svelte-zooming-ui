<script>
    // @ts-nocheck

    import ZUI from '$lib/ZoomingUIComponent.svelte';

    function handleZuiNotification(event) {
        console.log(event.detail);
    }

</script>

<div style="border:solid green 2px;width:50%;height:50%;transform:translate(-50%,-50%);top:50%;left:50%;position:absolute;">
    <ZUI on:zui-notification={handleZuiNotification} verbose=true/>
</div>
