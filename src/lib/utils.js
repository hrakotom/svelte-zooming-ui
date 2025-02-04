import UUID from "pure-uuid";
import { writable } from 'svelte/store';
import Decimal from "decimal.js";
import anime from "animejs";
import { beforeUpdate } from 'svelte'

/**
 * Collection of utility functions for the Svelte Zooming UI library.
 * These functions handle coordinate calculations, bounding boxes, and precision adjustments.
 * @module utils
 */

/**
 * Generates a version 4 UUID (random).
 * Used for creating unique identifiers for components.
 * @returns {string} A random UUID string.
 */
export function uuid4() {
  return new UUID(4);
}

/**
 * Calculates a bounding box for given coordinates and dimensions.
 * @param {Decimal} x - The x coordinate of the center
 * @param {Decimal} y - The y coordinate of the center
 * @param {Decimal} width - The width of the box
 * @param {Decimal} height - The height of the box
 * @param {Decimal} [offset=0] - Optional offset to expand/shrink the box
 * @returns {Object} Bounding box with left, right, top, bottom coordinates
 */
export function getBBox(x, y, width, height, offset) {

  if (!offset) offset = 0;

  return {
    left: x.minus(width.dividedBy(2)).minus(offset),
    right: x.plus(width.dividedBy(2)).plus(offset),
    top: y.plus(height.dividedBy(2)).plus(offset),
    bottom: y.minus(height.dividedBy(2)).minus(offset)
  };
}

/**
 * Checks if two bounding boxes intersect.
 * @param {Object} r1 - First bounding box {left, right, top, bottom}
 * @param {Object} r2 - Second bounding box {left, right, top, bottom}
 * @returns {boolean} True if the boxes intersect
 */
export function intersectsBBox(r1, r2) {

  return !(
    r2.left.gt(r1.right) ||
    r2.right.lt(r1.left) ||
    r2.top.lt(r1.bottom) ||
    r2.bottom.gt(r1.top)
  );

}

/**
 * Svelte action to observe an element's position and size.
 * Updates a store with the element's current dimensions.
 * Alternative to using bind:this in Svelte components.
 * 
 * @param {HTMLElement} el - The element to observe
 * @param {import('svelte/store').Writable} store - Store to update with position data
 * @returns {Object} Action cleanup handler
 */
export function positionObserved(el, store) {

  let dirty;

  let updater = function (node) {
    //console.log("Handling update or set...");
    let rect = node.getBoundingClientRect();
    return {
      x: Decimal(rect.x),
      y: Decimal(rect.y),
      w: Decimal(rect.width),
      h: Decimal(rect.height)
    };
  };


  beforeUpdate(() => {
    if (dirty) store.set(updater(el))
    dirty = false;
  });

  if (ResizeObserver) {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        dirty = true;
        //force before update to run;
        store.set(updater(entry.target));
      }
    });

    resizeObserver.observe(el);

    return {
      destroy() { resizeObserver.unobserve(el); }
    }
  }
}

/**
 * Evaluates coordinates and dimensions for positioning elements in the zooming UI.
 * Calculates visibility, transformation matrix, and screen dimensions based on camera position.
 * 
 * @param {Object} params - Parameters for coordinate evaluation
 * @param {Object} params.camera - Camera state {x, y, scale, w, h}
 * @param {Decimal} params.x - X coordinate
 * @param {Decimal} params.y - Y coordinate
 * @param {Decimal} params.width - Width
 * @param {Decimal} params.height - Height
 * @param {Decimal} [params.reference_width=500] - Reference width for scaling
 * @returns {Object} Evaluated coordinates and transformation data
 */
export function evaluateCoords(params) {

  // console.log("Evaluating coords");

  if (!params || !params.camera) return { visible: false };

  let camera = params.camera;
  let item = params;
  // this runs each time item changes
  // console.log("Registering change in item : " + JSON.stringify(item));

  if (!item.reference_width) {
    item.reference_width = Decimal(500);
  }

  let x = item.x;
  let y = item.y;
  let width = item.width;
  let height = item.height;

  let scalesize = width.dividedBy(Decimal(item.reference_width));

  // Calculate current ratio while we're at it
  let wratio = camera.h.dividedBy(camera.w);
  let oratio = height.dividedBy(width);

  let current_ratio = null;
  let visibility = null;
  if (wratio.gte(oratio)) {
    current_ratio = width.times(wratio).dividedBy(camera.h).times(camera.scale);
    visibility = intersectsBBox(getBBox(x, y, width, height, 0), getBBox(camera.x, camera.y, camera.w.dividedBy(camera.scale), camera.h.dividedBy(camera.scale), 0)) // potential offset : camera.w.dividedBy(camera.scale)
  } else {
    current_ratio = height.dividedBy(camera.h).times(camera.scale);
    visibility = intersectsBBox(getBBox(x, y, width, height, 0), getBBox(camera.x, camera.y, camera.w.dividedBy(camera.scale), camera.h.dividedBy(camera.scale), 0)) // potential offset : camera.h.dividedBy(camera.scale)
  }
  // visibility = true;
  if (!visibility) {
    return {
      visible: false
    }
  }

  let tgt_width = Decimal(item.reference_width);
  let tgt_height = (height.dividedBy(scalesize));

  let scaled = camera.scale.times(scalesize);

  let transform = "translate(-50%,-50%) matrix(" + [
    scaled.toNumber(), 0, 0, scaled.toNumber(),
    (x.minus(camera.x).plus(camera.w.dividedBy(camera.scale).dividedBy(2))).times(camera.scale).toNumber(),
    (y.minus(camera.y).minus(camera.h.dividedBy(camera.scale).dividedBy(2))).times(camera.scale.times(-1)).toNumber()
  ].join(",") + ")";


  let screen_width = width.times(camera.scale);
  let screen_height = height.times(camera.scale);

  screen_width = width.times(camera.scale);

  return {
    tgt_width: tgt_width,
    tgt_height: tgt_height,
    ratio: current_ratio,
    transform: transform,
    screen_width: screen_width,
    screen_height: screen_height,
    depth: item.depth,
    visible: visibility,
    scaled: scaled
  };

}

/**
 * Adjusts Decimal.js precision based on zoom scale to maintain accuracy.
 * Dynamically updates precision to handle different zoom levels efficiently.
 * 
 * @param {Decimal} zoomScaleDecimal - Current zoom scale
 */
export function adjustDecimalPrecision(zoomScaleDecimal) {
  // Define a base precision level                                                                                                                                                                                                  
  const basePrecision = 20; // This is an example value                                                                                                                                                                             

  // Calculate the new precision based on the zoom scale                                                                                                                                                                            
  // The formula for precision adjustment can be tweaked as needed                                                                                                                                                                  
  // Ensure that zoomScaleDecimal is a Decimal instance                                                                                                                                                                             

  const zoomScaleNumber = zoomScaleDecimal.toNumber();
  // extract the number of digits in the zoom scale
  let nb_digits = (""+Math.round(zoomScaleNumber)).length;
  // console.log("Digits: " + nb_digits);
  const newPrecision = Math.min(Math.max(nb_digits*2, basePrecision), Decimal.maxE);
  let previousPrecision = Decimal.precision;

  // Update Decimal precision                                                                                                                                                                                                       
  Decimal.set({ precision: newPrecision });
}                                                                                                                                                                                                                                     
