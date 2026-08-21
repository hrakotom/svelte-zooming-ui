import ZoomingUIComponent from './ZoomingUIComponent.svelte';
import Positionable from './Positionable.svelte';

/**
 * A zooming interface: a camera, and boxes placed in a world.
 *
 * What you put in the boxes is yours. Graphs, tables, documents — those are
 * things to DO with a zooming interface, not part of one, and keeping them here
 * would mean a library release every time an application changed its mind about
 * how something looks.
 *
 * Content gets `$frame` from context — its own box, plus `factor` (how much the
 * camera is scaling it, for strokes that must stay one device pixel) and `ratio`
 * (how much screen it occupies, for level of detail). `Clickable`, `Embedded`
 * and `LOD` are worked examples of all three.
 */
export { ZoomingUIComponent, Positionable };
