<script>
	import { onMount } from 'svelte';
	import { taskStore, taskHandlers } from '$lib/stores/taskStore';

	// Current month and year
	let currentDate = new Date();
	let currentMonth = currentDate.getMonth();
	let currentYear = currentDate.getFullYear();

	// Days in the current month
	let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

	// Get the first day of the month
	let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

	// Calendar grid
	let calendarGrid = [];

	// Fetch tasks and update the calendar
	async function updateCalendar() {
		// Fetch tasks from Firestore
		await taskHandlers.getTasks();

		// Get tasks from the store
		let tasks = [];
		taskStore.subscribe((state) => {
			tasks = state.tasks;
		});

		// Generate calendar grid
		calendarGrid = [];
		for (let i = 0; i < firstDayOfMonth; i++) {
			calendarGrid.push({ day: null, tasks: [] }); // Empty days before the first day
		}
		for (let day = 1; day <= daysInMonth; day++) {
			let date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			let dayTasks = tasks.filter((task) => task.taskStartDate === date);
			calendarGrid.push({ day, tasks: dayTasks });
		}
	}

	// Function to navigate to the previous month
	function prevMonth() {
		currentMonth--;
		if (currentMonth < 0) {
			currentMonth = 11;
			currentYear--;
		}
		updateCalendar();
	}

	// Function to navigate to the next month
	function nextMonth() {
		currentMonth++;
		if (currentMonth > 11) {
			currentMonth = 0;
			currentYear++;
		}
		updateCalendar();
	}

	// Initialize the calendar
	onMount(async () => {
		await updateCalendar();
	});
</script>

<div class="p-6">
	<!-- Page Header -->
	<div class="flex w-full items-center justify-between">
		<div class="text-xl font-bold text-black">Calendar</div>
		<div class="flex items-center gap-3">
			<div class="text-sm font-bold text-gray-500">
				{new Date(currentYear, currentMonth).toLocaleString('default', {
					month: 'long',
					year: 'numeric'
				})}
			</div>
		</div>
	</div>

	<!-- Calendar Navigation -->
	<div class="mt-6 flex items-center justify-between">
		<button on:click={prevMonth} class="rounded-md bg-[#5042A5] px-4 py-2 text-white">
			Previous
		</button>
		<button on:click={nextMonth} class="rounded-md bg-[#5042A5] px-4 py-2 text-white">
			Next
		</button>
	</div>

	<!-- Calendar Grid -->
	<div class="mt-6 grid grid-cols-7 gap-2">
		<!-- Weekday Headers -->
		{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
			<div class="text-center text-sm font-bold text-gray-500">{day}</div>
		{/each}

		<!-- Calendar Days -->
		{#each calendarGrid as cell}
			<div class="rounded-md border p-2 {cell.day ? 'bg-white' : 'bg-gray-100'}">
				{#if cell.day}
					<div class="text-sm font-bold text-black">{cell.day}</div>
					{#each cell.tasks as task}
						<div
							class="mt-1 rounded-md p-1 text-sm text-white"
							style={`background-color: ${task.color || '#5042A5'};`}
						>
							{task.title} ({task.taskStartTime})
						</div>
					{/each}
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.grid {
		display: grid;
	}
</style>
