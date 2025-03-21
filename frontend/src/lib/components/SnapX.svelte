<script>
	export let scrollContainer;
	export let startDrag;
	export let doDrag;
	export let stopDrag;
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={scrollContainer}
	on:mousedown={startDrag}
	on:mousemove={doDrag}
	on:mouseup={stopDrag}
	on:mouseleave={stopDrag}
	role="region"
	tabindex="-1"
	aria-label="Horizontal scrollable task cards"
	class="no-scrollbar flex w-full select-none snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-visible scroll-smooth"
>
	<slot />
</div>
