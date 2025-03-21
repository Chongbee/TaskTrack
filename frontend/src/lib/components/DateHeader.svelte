<script>
	export let date;
	export let taskCount;
	export let allTasksCompleted;

	function formatDate(dateString) {
		const date = new Date(dateString);
		return `${date.toLocaleString('en-US', { weekday: 'short' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'short' })}`;
	}
</script>

<h2 class="mb-2 text-sm font-bold text-black">
	{formatDate(date)}
	<span
		class="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full {allTasksCompleted
			? 'bg-white'
			: 'bg-[#F5F6FD]'} text-xs font-semibold text-gray-500"
	>
		{taskCount}
	</span>
</h2>
