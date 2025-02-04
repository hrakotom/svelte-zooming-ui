# Svelte Zooming UI

A powerful and flexible zooming user interface library for Svelte applications. Create infinite canvas experiences with intuitive pan and zoom controls.

## Features

- Smooth pan and zoom interactions
- Touch gesture support
- Infinite canvas
- Precise decimal-based positioning
- Level of detail management
- Responsive and performant

## Installation

```bash
npm install svelte-zooming-ui
```

## Core Components

### ZoomingUIComponent

The main container component that provides the zooming canvas functionality:

```svelte
<script>
    import { ZoomingUIComponent } from 'svelte-zooming-ui';
    
    let lookAt;
</script>

<ZoomingUIComponent bind:lookAt debug={false}>
    <!-- Your zoomable content here -->
</ZoomingUIComponent>
```

### Positionable

A component for positioning elements within the zooming canvas:

```svelte
<script>
    import { ZoomingUIComponent, Positionable } from 'svelte-zooming-ui';
    import Decimal from 'decimal.js';
</script>

<ZoomingUIComponent>
    <Positionable 
        x={Decimal(0)} 
        y={Decimal(0)} 
        width={Decimal(100)} 
        height={Decimal(100)} 
        depth={Decimal(1)}
    >
        <div>Your content here</div>
    </Positionable>
</ZoomingUIComponent>
```

## Advanced Usage

### Camera Control

The ZoomingUIComponent provides a `lookAt` function for programmatic control:

```svelte
<script>
    let lookAt;
    
    function centerOn(x, y, scale) {
        lookAt(x, y, scale);
    }
</script>

<ZoomingUIComponent bind:lookAt>
    <button on:click={() => centerOn(Decimal(0), Decimal(0), Decimal(1))}>
        Reset View
    </button>
</ZoomingUIComponent>
```

### Level of Detail

Manage content detail based on zoom level:

```svelte
<Positionable x={x} y={y} width={width} height={height}>
    {#if $frame.ratio <= 20.0}
        <HighDetailContent />
    {:else}
        <LowDetailContent />
    {/if}
</Positionable>
```

## API Reference

### ZoomingUIComponent Props

- `debug` (boolean): Enables debug visualization
- `lookAt` (function): Bind to control camera position

### Positionable Props

- `x` (Decimal): X coordinate
- `y` (Decimal): Y coordinate
- `width` (Decimal): Width
- `height` (Decimal): Height
- `depth` (Decimal): Z-index depth
- `debug` (boolean): Enables debug visualization

## Examples

Check out our example components:

- `Clickable.svelte`: Interactive area example
- `LOD.svelte`: Level of detail implementation
- `Embedded.svelte`: Nested content example

## Contributing

Contributions are welcome! Please see our contributing guidelines for details.

## License

MIT License - see LICENSE.md for details

