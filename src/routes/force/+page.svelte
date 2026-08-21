<script>
	import ZUI from '$lib/ZoomingUIComponent.svelte';
	import ForceGraph from '$lib/ForceGraph.svelte';
	export let data;
</script>

<div style="position:absolute;inset:0;overflow:hidden;background:#f7f7f5;">
	<ZUI debug={false}>
		<ForceGraph data={data.tree} initialDepth={1} />
	</ZUI>
</div>
