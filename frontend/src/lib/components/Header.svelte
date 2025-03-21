<script>
	const date = new Date();
	const formattedDate = `${date.toLocaleString('en-US', { weekday: 'long' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;
</script>

<div class="flex w-full min-w-[200px] flex-wrap items-center justify-between gap-2">
	<div class="text-md whitespace-nowrap font-bold text-black">My Activities</div>
	<div class="flex items-center gap-3 whitespace-nowrap">
		<div class="text-sm font-bold text-gray-500">{formattedDate}</div>
	</div>
</div>
