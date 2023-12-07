import UUID from "pure-uuid";
import { writable } from 'svelte/store';
import Decimal from "decimal.js";
import anime from "animejs";
import { beforeUpdate } from 'svelte'

/**
 * Generates a version 4 UUID (random).
 * @returns {string} A random UUID string.
 */
export function uuid4() {
  return new UUID(4);
}

// Gets the bbox of coordinates, offset can be used to
// expand/shrink the resulting bbox
export function getBBox(x, y, width, height, offset) {

  if (!offset) offset = 0;

  return {
    left: x.minus(width.dividedBy(2)).minus(offset),
    right: x.plus(width.dividedBy(2)).plus(offset),
    top: y.plus(height.dividedBy(2)).plus(offset),
    bottom: y.minus(height.dividedBy(2)).minus(offset)
  };
}

// Returns true if two bounding boxes intersect
export function intersectsBBox(r1, r2) {

  return !(
    r2.left.gt(r1.right) ||
    r2.right.lt(r1.left) ||
    r2.top.lt(r1.bottom) ||
    r2.bottom.gt(r1.top)
  );

}

// action to get position and size of an element
// as an alternative to svelte bind:this
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

