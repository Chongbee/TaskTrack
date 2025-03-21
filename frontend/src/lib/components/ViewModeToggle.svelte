<script>
	export let viewMode;
	export let viewStyle;
	import Grid from '$lib/icons/Grid.svelte';
	import List from '$lib/icons/List.svelte';
</script>

<div class="flex items-center gap-3">
	<div class="flex items-center rounded-full bg-gray-200 p-0 shadow-md">
		<button
			on:click={() => viewMode.set('day')}
			class="rounded-full px-5 py-2 text-sm font-semibold transition-all {$viewMode === 'day'
				? 'bg-[#868698] text-white shadow'
				: 'text-gray-500'}"
		>
			Day
		</button>
		<button
			on:click={() => viewMode.set('week')}
			class="rounded-full px-5 py-2 text-sm font-semibold transition-all {$viewMode === 'week'
				? 'bg-[#868698] text-white shadow'
				: 'text-gray-500'}"
		>
			Week
		</button>
	</div>
	<div class="flex items-center rounded-full bg-gray-200 p-0 shadow-md">
		<button
			on:click={() => viewStyle.set('default')}
			class="rounded-full px-5 py-2 text-sm font-semibold transition-all {$viewStyle === 'default'
				? 'bg-[#868698] text-white shadow'
				: 'text-gray-500'}"
		>
			<List />
		</button>
		<button
			on:click={() => viewStyle.set('condensed')}
			class="rounded-full px-5 py-2 text-sm font-semibold transition-all {$viewStyle === 'condensed'
				? 'bg-[#868698] text-white shadow'
				: 'text-gray-500'}"
		>
			<Grid />
		</button>
	</div>
</div>
