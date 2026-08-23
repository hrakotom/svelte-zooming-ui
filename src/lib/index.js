import ZoomingUIComponent from './ZoomingUIComponent.svelte';
import Positionable from './Positionable.svelte';
import { keepAlive } from './keepAlive.svelte.js';

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
 *
 * A box can animate to a new position (`transition`) and INTO existence
 * (`enter_from`). It cannot animate out of one — by the time the data drops an
 * item its component is already being destroyed — so exit lives in `keepAlive`,
 * which is a property of the list rather than of the box.
 */
export { ZoomingUIComponent, Positionable, keepAlive };
