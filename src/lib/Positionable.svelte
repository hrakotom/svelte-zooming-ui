<script>
    import { onMount } from 'svelte';
    import { positionable } from './utils.js';
    import { ui_store } from './utils.js';

    export let x = 0;
    export let y = 0;
    export let width = 0;
    export let height = 0;

    let node;

    onMount(() => {
        const params = {
            x: x,
            y: y,
            width: width,
            height: height,
            camera: $ui_store.world[id].camera
        };
        const positionableInstance = positionable(node, params);
        return () => {
            positionableInstance.destroy();
        };
    });
</script>

<div bind:this={node} style="position: absolute;">
    <slot />
</div>
