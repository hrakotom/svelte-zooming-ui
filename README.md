# svelte-zooming-ui

WARNING :: Work In Progress :: use at your own risk, breaking changes will occur

Specification: A zooming user interface that just works. Like you imagined it would. With regular vanilla components.

## Example Usage

Here's a simple example of how to create a 2D zoomable scene using the `ZUI`, `Positionable`, and `Clickable` components:

```svelte
<script>
    import ZUI from '$lib/ZoomingUIComponent.svelte';
    import Positionable from '$lib/Positionable.svelte';
    import Clickable from '$lib/Clickable.svelte';
    import Decimal from 'decimal.js';

    let lookAt;

    function handleZuiNotification(event) {
        console.log("ZUI notification: " + event.detail);
    }
</script>

<ZUI on:zui-notification={handleZuiNotification} debug={true} bind:lookAt={lookAt}>
    <Positionable x={Decimal(0)} y={Decimal(0)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={false}>
        <Clickable bgcolor="yellow">Positionable Element</Clickable>
    </Positionable>
    <Positionable x={Decimal(60)} y={Decimal(60)} width={Decimal(50)} height={Decimal(50)} depth={Decimal(1)} debug={false}>
        <Clickable bgcolor="blue">Another Positionable Element</Clickable>
    </Positionable>
</ZUI>
```

## To-Do List

- [x] create two basic components for the zui.
- [x] Give Each zui component has zooming capability.
    - [x] create a lookAt function that takes a point and a zoom level.
    - [x] Handle drag events.
    - [x] Handle zoom events. ( finger and mouse wheel )

