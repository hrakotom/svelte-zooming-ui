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
