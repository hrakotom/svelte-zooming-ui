<script>
    import { BROWSER } from 'esm-env';
    import ZUI from '$lib/ZoomingUIComponent.svelte';
    import Positionable from '$lib/Positionable.svelte';
    import Clickable from '$lib/Clickable.svelte';
    import Embedded from '$lib/Embedded.svelte';
    import Decimal from 'decimal.js';
    import { fade } from 'svelte/transition';
    import { onMount, createEventDispatcher } from 'svelte';

    let verbose = true;

    let menu = {
        "basic-stuff" : {
            "label" : "Basic stuff",
            "selected" : true,
        },
        "full-screen-and-lod" : {
            "label" : "Full screen and LOD",
            "selected" : false,
        },
    };

    function handleZuiNotification(event) {
        console.log("ZUI notification: " + event.detail);
    }

    onMount(() => {
        window.menu = menu;
    });

</script>

<div style="position:absolute;padding:11px;border solid rgba(0,0,0,0.5) 1px;box-sizing:border-box;display:flex;">
    {#each Object.entries(menu) as [name, details]}
        <div on:click={ 
            function() {
                Object.entries(menu).forEach(([key, value]) => {
                    if(key === name)
                        value.selected = true;
                    else
                        value.selected = false;
                });
                menu = menu;
            } } style={"box-sizing:border-box;padding:11px;border:solid rgba(0,0,0,.2) 1px;border-radius:4px;margin:2px;cursor: pointer;"+( details.selected ? "background-color:yellow;font-weight:900;" : "background-color:white;font-weight:200;" )}>
            {name}
        </div>
    {/each}
</div>

{#if menu['basic-stuff'].selected}
    <div style="border:solid green 2px;width:25%;height:50%;transform:translate(-50%,-50%);top:50%;left:75%;position:absolute;">
        <ZUI on:zui-notification={handleZuiNotification} debug={false}>
            <Positionable x={Decimal(0)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={false}>
                <div style="background-color: yellow;width:100%;height:100%;font-weight:900;font-size:31px;display:flex;justify-content: center;padding-top:21px;">NOOOT CLICKABLE !</div>
            </Positionable>
            <Positionable x={Decimal(60)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
                <Clickable bgcolor="red">Positionable Element</Clickable>
            </Positionable>
            <Positionable x={Decimal(60)} y={Decimal(60)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={false}>
                <Clickable bgcolor="blue">Positionable Element</Clickable>
            </Positionable>
            <Positionable x={Decimal(0)} y={Decimal(60)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={false}>
                <Clickable bgcolor="green">Positionable Element</Clickable>
            </Positionable>
        </ZUI>
    </div>

    <div style="border:solid green 2px;width:25%;height:50%;transform:translate(-50%,-50%);top:50%;left:25%;position:absolute;">
        <ZUI on:zui-notification={handleZuiNotification} debug={false}>
            <Positionable x={Decimal(0)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={false}>
                <Clickable bgcolor="yellow">Positionable Element</Clickable>
            </Positionable>
            <Positionable x={Decimal(60)} y={Decimal(60)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={false}>
                <Clickable bgcolor="blue">Positionable Element</Clickable>
            </Positionable>
            <Positionable x={Decimal(60)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={true}>
                <Embedded slot="positionable"/>
            </Positionable>
        </ZUI>
    </div>
{/if}
