<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { userHandlers, userStore } from '$lib/stores/userStore';
	import { authStore } from '$lib/stores/authStore';
	import AddTask from '$lib/components/AddTask.svelte';
	import { taskHandlers, taskStore } from '$lib/stores/taskStore';
	import { writable } from 'svelte/store';
	import { getWeekDateRange } from '$lib/utils/utils';
	import { clickOutside } from '$lib/utils/clickOutside.js'; // Custom action to close on outside click
	import TaskCard from '$lib/components/TaskCard.svelte';
	import ViewModeToggle from '$lib/components/ViewModeToggle.svelte';
	import DateHeader from '$lib/components/DateHeader.svelte';
	import TaskDropdown from '$lib/components/TaskDropdown.svelte';
	import SnapX from '$lib/components/SnapX.svelte';
	import Header from '$lib/components/Header.svelte';

	let userId = null;
	let userData = null;
	let myTasks = [];
	let myTasksData = null;
	let viewMode = writable('day'); // 'day' or 'week'
	let viewStyle = writable('default');

	// Subscribe to auth store
	authStore.subscribe((curr) => {
		userId = curr?.currentUser?.uid;
		if (userId) {
			userHandlers.getUser(userId);
		}
	});

	// Subscribe to user store
	userStore.subscribe((curr) => {
		userData = curr?.currentUser;
		myTasks = curr?.currentUser?.tasks || [];
	});

	// Fetch tasks for user when myTasks changes
	$: if (myTasks.length > 0) {
		taskHandlers.getMyTasks(myTasks);
	}

	// Subscribe to task store and grab tasks
	taskStore.subscribe((curr) => {
		myTasksData = curr?.tasks;
	});

	// Group tasks by date
	let groupedTasks = {};
	$: {
		if (Array.isArray(myTasksData) && myTasksData.length > 0) {
			groupedTasks = myTasksData.reduce((acc, task) => {
				if (task.taskStartDate && task.taskCategory === 'Work') {
					const taskDate = new Date(task.taskStartDate).toISOString().split('T')[0];
					if (!acc[taskDate]) {
						acc[taskDate] = [];
					}
					acc[taskDate].push(task);
				}
				return acc;
			}, {});
		}
	}

	// Function to get the week number from a date
	function getWeekNumber(date) {
		const startDate = new Date(date.getFullYear(), 0, 1);
		const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
		return Math.ceil((days + 1) / 7);
	}

	// Group tasks by week
	let groupedTasksByWeek = {};
	$: {
		if (Array.isArray(myTasksData) && myTasksData.length > 0) {
			groupedTasksByWeek = myTasksData.reduce((acc, task) => {
				if (task.taskCategory === 'Work') {
					const taskDate = new Date(task.taskStartDate);
					const weekNumber = getWeekNumber(taskDate);
					if (!acc[weekNumber]) {
						acc[weekNumber] = [];
					}
					acc[weekNumber].push(task);
				}
				return acc;
			}, {});
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return `${date.toLocaleString('en-US', { weekday: 'short' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'short' })}`;
	}

	let isDragging = false;
	let startX, scrollLeft;
	let scrollContainer;

	function startDrag(e) {
		if (e.target.closest('.dashboard')) return;
		isDragging = true;
		startX = e.pageX;
		scrollLeft = scrollContainer.scrollLeft;
	}

	function stopDrag() {
		isDragging = false;
	}

	function doDrag(e) {
		if (!isDragging) return;
		e.preventDefault();
		const x = e.pageX;
		const walk = (x - startX) * 1; // Adjust the multiplier for faster/slower scrolling
		scrollContainer.scrollLeft = scrollLeft - walk;
	}
	function toggleOptions(task, event) {
		if (activeDropdown && activeDropdown.task.id === task.id) {
			activeDropdown = null;
		} else {
			const rect = event.currentTarget.getBoundingClientRect();
			activeDropdown = {
				task,
				style: `position: fixed; top: ${rect.bottom + 4}px; left: ${rect.left}px; width: 8rem;`
			};
		}
	}

	let activeDropdown = null;

	function toggleViewMode(mode) {
		viewMode.set(mode);
	}
</script>

<div class="flex w-full min-w-[200px] flex-wrap items-center justify-between gap-2">
	<Header />
</div>

<div class="flex w-full items-center justify-between p-2">
	<div class="text-xl font-bold text-black">Work</div>
	<div class="flex items-center gap-3">
		<!-- Day/Week Toggle -->
		<ViewModeToggle {viewMode} {viewStyle} />

		<div>
			<AddTask />
		</div>
	</div>
</div>

<!-- Horizontal scroll container -->
<SnapX bind:scrollContainer {startDrag} {doDrag} {stopDrag}>
	{#if $viewMode === 'day' && Object.keys(groupedTasks).length > 0}
		{#each Object.keys(groupedTasks) as date (date)}
			<div
				class="relative flex w-1/3 flex-shrink-0 snap-start flex-col gap-4 rounded-md bg-white p-3 shadow"
			>
				<div class="mb-1 flex flex-col gap-2 px-2">
					<DateHeader
						{date}
						taskCount={groupedTasks[date].length}
						allTasksCompleted={groupedTasks[date].every((task) => task.completed)}
					/>

					{#each groupedTasks[date] as task (task.id)}
						<TaskCard {task} viewStyle={$viewStyle} {toggleOptions} {activeDropdown} />
					{/each}
				</div>
			</div>
		{/each}
	{:else if $viewMode === 'week' && Object.keys(groupedTasksByWeek).length > 0}
		<div class="flex h-[calc(100vh-200px)] flex-col flex-wrap gap-4">
			{#each Object.keys(groupedTasksByWeek) as week (week)}
				<div class="flex w-full flex-col gap-4 rounded-md bg-white p-3 shadow">
					<h2 class="mb-2 text-sm font-bold text-black">Week {week}: {getWeekDateRange(week)}</h2>
					<div class="flex flex-col gap-2">
						{#each groupedTasksByWeek[week] as task (task.id)}
							<TaskCard {task} viewStyle={$viewStyle} {toggleOptions} {activeDropdown} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-500">No tasks available.</p>
	{/if}
</SnapX>

<!-- Global Dropdown -->
{#if activeDropdown}
	<div
		use:clickOutside={() => (activeDropdown = null)}
		style={activeDropdown.style}
		class="z-[100] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
	>
		<TaskDropdown task={activeDropdown.task} style={activeDropdown.style} />
	</div>
{/if}
