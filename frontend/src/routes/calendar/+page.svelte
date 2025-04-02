<script>
	import { onMount } from 'svelte';
	import { taskStore, taskHandlers } from '$lib/stores/taskStore';
	import { userStore } from '$lib/stores/userStore';
	import { authStore } from '$lib/stores/authStore';
	import Header from '$lib/components/Header.svelte';

	// Current month and year
	let currentDate = new Date();
	let currentMonth = currentDate.getMonth();
	let currentYear = currentDate.getFullYear();
	let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
	let calendarGrid = [];
	let userTasks = [];
	let userId = '';
	let isLoading = false;

	// Get days in month
	const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

	// Fetch tasks and update the calendar
	async function updateCalendar() {
		// Get user ID from authStore
		authStore.subscribe((state) => {
			if (state.currentUser) {
				userId = state.currentUser.uid;
			}
		});

		// Get user's task IDs from userStore
		let taskIds = [];
		userStore.subscribe((state) => {
			if (state.currentUser && state.currentUser.tasks) {
				taskIds = state.currentUser.tasks;
			}
		});

		// Fetch only the user's tasks
		if (taskIds.length > 0) {
			await taskHandlers.getMyTasks(taskIds);
		}

		// Get tasks from the store and filter by user
		taskStore.subscribe((state) => {
			userTasks = state.tasks.filter((task) => {
				return task.userId === userId || taskIds.includes(task.id);
			});
		});

		// Generate calendar grid
		calendarGrid = [];
		for (let i = 0; i < firstDayOfMonth; i++) {
			calendarGrid.push({ day: null, tasks: [] });
		}
		for (let day = 1; day <= daysInMonth; day++) {
			let date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			let dayTasks = userTasks.filter((task) => task.taskStartDate === date);
			calendarGrid.push({ day, tasks: dayTasks });
		}
		// Add greyed-out cells for extra days
		const totalCells = 35;
		while (calendarGrid.length < totalCells) {
			calendarGrid.push({ day: null, tasks: [] });
		}
	}

	// Navigation functions remain the same
	function prevMonth() {
		currentMonth--;
		if (currentMonth < 0) {
			currentMonth = 11;
			currentYear--;
		}
		updateCalendar();
	}

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

<div class="flex h-screen flex-col bg-gray-50">
	<div class="flex-1 overflow-y-auto p-6">
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

		{#if isLoading}
			<div class="mt-8 text-center">Loading tasks...</div>
		{:else}
			<!-- Calendar Grid -->
			<div class="mt-6 grid grid-cols-7 gap-2">
				<!-- Weekday Headers -->
				{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
					<div class="text-center text-sm font-bold text-gray-500">{day}</div>
				{/each}

				<!-- Calendar Days -->
				{#each calendarGrid as cell, i}
					<div
						class="flex h-32 flex-col rounded-md border border-gray-200 p-2
                   {cell.day ? 'bg-white' : 'bg-gray-100'}"
					>
						{#if cell.day}
							<div class="text-sm font-bold text-gray-800">{cell.day}</div>
							<div class="mt-1 flex-1 overflow-y-auto">
								{#each cell.tasks as task}
									<div
										class="mb-1 truncate rounded-md p-1 text-xs text-white"
										style={`background-color: ${task.color || '#5042A5'};`}
									>
										{task.title}
										{task.taskStartTime ? `(${task.taskStartTime})` : ''}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
