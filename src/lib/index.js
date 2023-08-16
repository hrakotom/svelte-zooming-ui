// Reexport your entry components here
export { default as ZUI } from './ZoomingUIComponent.svelte';

document.addEventListener('zui-notification', (event) => {
    console.log(event.detail);
});
