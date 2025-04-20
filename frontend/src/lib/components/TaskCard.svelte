<script>
	//@ts-nocheck
	export let task;
	export let viewStyle = 'default'; // 'default' or 'condensed'
	export let toggleOptions; // Function to toggle dropdown
	export let activeDropdown; // Active dropdown state
	import { taskHandlers } from '$lib/stores/taskStore';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';
	import Clock from '$lib/icons/Clock.svelte';

	// Function to toggle task completion
	async function toggleTaskCompletion() {
		await taskHandlers.updateTask(task.id, { completed: task.completed });
	}

	// Function to format duration
	function formatDuration(duration) {
		if (!duration) return '';
		let hours = 0;
		let minutes = 0;
		if (duration.includes(':')) {
			[hours, minutes] = duration.split(':').map(Number);
		} else if (duration.includes('h') || duration.includes('m')) {
			if (duration.includes('h')) hours = parseInt(duration.split(' ')[0], 10);
			if (duration.includes('m')) minutes = parseInt(duration.split(' ')[0], 10);
		}
		let formattedDuration = '';
		if (hours > 0) formattedDuration += `${hours} h`;
		if (minutes > 0) formattedDuration += `${formattedDuration ? ' ' : ''}${minutes} min`;
		return `(${formattedDuration})`;
	}

	// Function to get priority indicator HTML
	function getPriorityIndicator(priority) {
		const size = 'w-3 h-1.5';
		switch (priority) {
			case 'High':
				return `
          <div class="bg-red-600 ${size}"></div>
          <div class="bg-red-600 ${size}"></div>
          <div class="bg-red-600 ${size}"></div>
        `;
			case 'Medium':
				return `
          <div class="bg-yellow-500 ${size}"></div>
          <div class="bg-yellow-500 ${size}"></div>
          <div class="bg-gray-300 ${size}"></div>
        `;
			case 'Low':
				return `
          <div class="bg-green-600 ${size}"></div>
          <div class="bg-gray-300 ${size}"></div>
          <div class="bg-gray-300 ${size}"></div>
        `;
			default:
				return '';
		}
	}
</script>

{#if viewStyle === 'default'}
	<!-- Default Task View -->
	<div
		class="relative mb-1 flex rounded-md p-2 shadow {task.completed ? 'bg-white' : 'bg-[#F5F6FD]'}"
	>
		<div class="absolute right-1 top-2">
			<button
				on:click={(e) => toggleOptions(task, e)}
				class="h-5 w-5 text-gray-500 hover:text-gray-800"
				aria-label="Open task options"
			>
				<DotsVertical />
			</button>
		</div>
		<div class="flex items-center gap-2 border-l-2 border-red-600 px-2">
			<input
				type="checkbox"
				bind:checked={task.completed}
				on:change={toggleTaskCompletion}
				class="h-4 w-4 appearance-none rounded-sm border-none bg-[#E2DCFD] outline-none checked:bg-[#5042A5] focus:ring-0"
			/>
			<div class="flex-grow">
				<h3 class="text-lg font-semibold">{task.title || 'Untitled Task'}</h3>
				<p class="text-sm text-gray-600">{task.description || 'No description provided.'}</p>
				<p class="text-sm text-gray-500">
					<span class="flex gap-1">{@html getPriorityIndicator(task.priority)}</span>
				</p>
			</div>
		</div>
		{#if task.taskStartTime}
			<span class="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-500">
				<Clock class="h-3 w-3" />
				{task.taskStartTime}
				{formatDuration(task.taskDuration)}
			</span>
		{/if}
	</div>
{:else}
	<!-- Condensed Task View -->
	<div class="relative mb-1 flex items-center bg-white">
		<input
			type="checkbox"
			bind:checked={task.completed}
			on:change={toggleTaskCompletion}
			class="h-4 w-4 appearance-none rounded-sm border-none bg-[#E2DCFD] outline-none checked:bg-[#5042A5] focus:ring-0"
		/>
		<div class="ml-2 flex-grow">
			<h3 class="text-lg font-semibold">{task.title || 'Untitled Task'}</h3>
		</div>
		{#if task.taskStartTime}
			<span class="ml-2 flex items-center gap-1 text-xs text-gray-500">
				<Clock class="h-3 w-3" />
				{task.taskStartTime}
				{formatDuration(task.taskDuration)}
			</span>
		{/if}
		<div class="ml-2">
			<button
				on:click={(e) => toggleOptions(task, e)}
				class="h-5 w-5 text-gray-500 hover:text-gray-800"
			>
				<DotsVertical />
			</button>
		</div>
	</div>
{/if}
