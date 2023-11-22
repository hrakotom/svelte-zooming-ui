<script>
    import { BROWSER } from 'esm-env';
    import ZUI from '$lib/ZoomingUIComponent.svelte';
    import Positionable from '$lib/Positionable.svelte';
    import Clickable from '$lib/Clickable.svelte';
    import Decimal from 'decimal.js';
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';

    let verbose = true;

    function handleZuiNotification(event) {
        console.log("ZUI notification: " + event.detail);
    }


</script>

<div style="border:solid green 2px;width:25%;height:50%;transform:translate(-50%,-50%);top:50%;left:75%;position:absolute;">
    <ZUI on:zui-notification={handleZuiNotification} debug={true}>
        <Positionable x={Decimal(0)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
            <div style="background-color: yellow;width:100%;height:100%;">NOOOT CLICKABLE !</div>
        </Positionable>
        <Positionable x={Decimal(60)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
            <Clickable bgcolor="red">Positionable Element</Clickable>
        </Positionable>
        <Positionable x={Decimal(60)} y={Decimal(60)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
            <Clickable bgcolor="blue">Positionable Element</Clickable>
        </Positionable>
        <Positionable x={Decimal(0)} y={Decimal(60)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
            <Clickable bgcolor="green">Positionable Element</Clickable>
        </Positionable>
    </ZUI>
</div>

<div style="border:solid green 2px;width:25%;height:50%;transform:translate(-50%,-50%);top:50%;left:25%;position:absolute;">
    <ZUI on:zui-notification={handleZuiNotification} debug={true}>
        <Positionable x={Decimal(0)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
            <Clickable bgcolor="yellow">Positionable Element</Clickable>
        </Positionable>
        <Positionable x={Decimal(60)} y={Decimal(60)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
            <Clickable bgcolor="blue">Positionable Element</Clickable>
        </Positionable>
    </ZUI>
</div>
