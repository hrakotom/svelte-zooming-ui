import UUID from "pure-uuid";
import { writable } from 'svelte/store';
import Decimal from "decimal.js";
import anime from "animejs";
import {beforeUpdate} from 'svelte'

export function uuid4() {
  // Generates a version 4 UUID (random)
  return new UUID(4);
}

export function notify(message, type = "info", duration = 3000) {
  // Sends a notification message to the UI store
  ui_store.update(function (value) {
    if (!value.notifications) value.notifications = [];
    value.notifications.push({
      message: message,
      type: type,
      duration: duration,
      uuid: "" + uuid4()
    });
    return value;
  });
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

  let updater = function(node) {
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
	
	if(ResizeObserver) {
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
