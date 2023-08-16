<script>
    import { onMount, onDestroy } from 'svelte';
    import ZUI from '$lib/ZoomingUIComponent.svelte';

    let zuiNotificationHandler;

    onMount(() => {
        zuiNotificationHandler = (event) => console.log(event.detail);
        document.addEventListener('zui-notification', zuiNotificationHandler);
    });

    onDestroy(() => {
        document.removeEventListener('zui-notification', zuiNotificationHandler);
    });
</script>

<div style="border:solid green 2px;padding:10px;width:50%;height:50%;transform:translate(-50%,-50%);top:50%;left:50%;position:absolute;">
    <ZUI />
</div>

