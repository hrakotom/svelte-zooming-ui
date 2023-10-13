<script>
    export let x = 0;
    export let y = 0;
    export let width = 0;
    export let height = 0;
</script>

<div style="position: absolute; left: {x}px; top: {y}px; width: {width}px; height: {height}px;">
    <slot />
</div>
