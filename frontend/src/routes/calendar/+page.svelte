<script>
	import { onMount } from 'svelte';
	import { taskStore, taskHandlers } from '$lib/stores/taskStore';
	import Header from '$lib/components/Header.svelte';

	// Current month and year
	let currentDate = new Date();
	let currentMonth = currentDate.getMonth();
	let currentYear = currentDate.getFullYear();

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
		// Add greyed-out cells for extra days (if any)
		const totalCells = 35; // 5 rows x 7 columns (adjust as needed)
		while (calendarGrid.length < totalCells) {
			calendarGrid.push({ day: null, tasks: [] }); // Greyed-out placeholder cells
		}
	}
	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

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

<!-- Main Content -->
<div class="flex h-screen flex-col">
	<!-- Scrollable Calendar Area -->
	<div class="flex-1 overflow-y-auto p-6">
		<!-- Page Header -->
		<Header />

		<!-- Calendar Navigation -->
		<div class="mt-6 flex items-center justify-between">
			<button
				on:click={prevMonth}
				class="rounded-md bg-[#5042A5] px-4 py-2 text-white hover:bg-[#3A2E7A]"
			>
				Previous
			</button>
			<div class="text-lg font-bold text-gray-800">
				{new Date(currentYear, currentMonth).toLocaleString('default', {
					month: 'long',
					year: 'numeric'
				})}
			</div>
			<button
				on:click={nextMonth}
				class="rounded-md bg-[#5042A5] px-4 py-2 text-white hover:bg-[#3A2E7A]"
			>
				Next
			</button>
		</div>

		<!-- Calendar Grid -->
		<div class="mt-6 grid grid-cols-7 gap-2 overflow-hidden">
			<!-- Weekday Headers -->
			{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
				<div class="text-center text-sm font-bold text-gray-500">{day}</div>
			{/each}

			<!-- Calendar Days -->
			{#each calendarGrid as cell}
				<div
					class="flex h-32 flex-col rounded-md border border-gray-200 p-2 {cell.day
						? 'bg-white'
						: 'bg-gray-100'}"
				>
					{#if cell.day}
						<div class="text-sm font-bold text-gray-800">{cell.day}</div>
						<div class="mt-1 flex-1 overflow-y-auto">
							{#each cell.tasks as task}
								<div
									class="mb-1 rounded-md p-1 text-xs text-white"
									style={`background-color: ${task.color || '#5042A5'};`}
								>
									{task.title} ({task.taskStartTime})
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
