<!-- src/lib/components/ProgressBar.svelte -->
<script>
	export let progress;
	export let color = 'purple';

	const colors = {
		purple: 'bg-[#5042A5]',
		blue: 'bg-blue-500',
		green: 'bg-green-500'
	};
</script>

<div class="h-2 w-full rounded-full bg-gray-200">
	<div class="h-2 rounded-full {colors[color]}" style="width: {progress}%"></div>
</div>
