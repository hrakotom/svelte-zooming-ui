import UUID from "pure-uuid";
import { writable } from 'svelte/store';

export function uuid4() {
  return new UUID(4);
}

export const ui_store = writable({});

export function notify(message, type = "info", duration = 3000) {
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

export function evaluateCoords(params) {

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

  screen_width = width.times(camera.scale) ;

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

export function positionable(node, params) {

  let item = evaluateCoords(params);
  if (item.visible) {
    node.style = "position:absolute;top:0px;left:0px;transform:" + item.transform + ";width:" + item.tgt_width.toNumber() + "px;height:" + item.tgt_height.toNumber() + "px;zIndex:" + item.depth.toNumber() + ";" + (params.extra_style ? params.extra_style : "");
  } else {
    node.style = "display:none;";
  }
  // console.log("Visibility: " + item.visible);
  return {
    update: function (newParams) {
      if (newParams.flagged) console.log("Params updated to: " + newParams.height);
      let item = evaluateCoords(newParams);
      if (item.visible) {
        // console.log("TEST : " + newParams.extra_style);
        node.style = "position:absolute;top:0px;left:0px;transform:" + item.transform + ";width:" + item.tgt_width.toNumber() + "px;height:" + item.tgt_height.toNumber() + "px;zIndex:" + item.depth.toNumber() + ";" + (newParams.extra_style ? newParams.extra_style : "");
        // console.log("Updating positionable: " + Math.round(item.tgt_width)+"x"+Math.round(item.tgt_height));
      } else {
        node.style = "display:none;";
      }
      if (params.flagged) console.log("Visibility: " + item.visible);

    },
    destroy: function () {
      if (params.flagged) console.log("positionable was destroyed");
      anime.remove(node);
    }
  }

}
