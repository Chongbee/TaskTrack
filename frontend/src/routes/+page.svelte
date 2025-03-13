<script>
	// @ts-nocheck
	import { userHandlers, userStore } from '$lib/stores/userStore';
	import { authStore } from '$lib/stores/authStore';
	import AddTask from '$lib/components/AddTask.svelte';
	import { taskHandlers, taskStore } from '$lib/stores/taskStore';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';
	import Clock from '$lib/icons/Clock.svelte';
	import { writable } from 'svelte/store';
	import Grid from '$lib/icons/Grid.svelte';
	import List from '$lib/icons/List.svelte';
	import { getWeekDateRange } from '$lib/utils/utils';
	import EditTask from '$lib/components/EditTask.svelte';
	import { clickOutside } from '$lib/utils/clickOutside.js'; // Custom action to close on outside click

	let userId = null;
	let userData = null;
	let myTasks = [];
	let myTasksData = null;
	let showOptionsForTask = null; // to track which task's options are shown
	let viewMode = writable('day'); // 'day' or 'week'
	let dropdownRef;
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
		console.log('tasks', myTasksData);
	});

	// Group tasks by date
	let groupedTasks = {};

	// Group tasks by date
	$: {
		if (Array.isArray(myTasksData) && myTasksData.length > 0) {
			groupedTasks = myTasksData.reduce((acc, task) => {
				if (task.taskStartDate) {
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
				const taskDate = new Date(task.taskStartDate);
				const weekNumber = getWeekNumber(taskDate);
				if (!acc[weekNumber]) {
					acc[weekNumber] = [];
				}
				acc[weekNumber].push(task);
				return acc;
			}, {});
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return `${date.toLocaleString('en-US', { weekday: 'short' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'short' })}`;
	}

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
	let isDragging = false;
	let startX, scrollLeft;
	let scrollContainer;

	function startDrag(e) {
		// Prevent dragging if the clicked element is part of the dashboard
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
	async function toggleTaskCompletion(task) {
		// Update task completion in Firebase
		await taskHandlers.updateTask(task.id, { completed: task.completed });
	}

	const date = new Date();
	const formattedDate = `${date.toLocaleString('en-US', { weekday: 'long' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;

	function toggleOptions(taskId) {
		// Toggle the visibility of options for the specific task
		showOptionsForTask = showOptionsForTask === taskId ? null : taskId;
	}

	function deleteTask(taskId) {
		// Handle task deletion logic here
		taskHandlers.deleteTask(taskId);
		showOptionsForTask = null; // Close the dropdown after deletion
	}

	function editTask(taskId) {
		// Handle task edit logic here
		// You can redirect to an edit page or open a modal
		showOptionsForTask = null; // Close the dropdown after editing
	}

	function formatDuration(duration) {
		if (!duration) return '';

		let hours = 0;
		let minutes = 0;

		if (duration.includes(':')) {
			// Handle HH:mm format
			[hours, minutes] = duration.split(':').map(Number);
		} else if (duration.includes('h') || duration.includes('m')) {
			// Handle template durations (e.g., "1 h", "30 m")
			if (duration.includes('h')) {
				hours = parseInt(duration.split(' ')[0], 10);
			}
			if (duration.includes('m')) {
				minutes = parseInt(duration.split(' ')[0], 10);
			}
		}

		let formattedDuration = '';

		if (hours > 0) {
			formattedDuration += `${hours} h`;
		}
		if (minutes > 0) {
			if (formattedDuration) formattedDuration += ' ';
			formattedDuration += `${minutes} min`;
		}

		return `(${formattedDuration})`;
	}

	$: {
		if (Array.isArray(myTasksData) && myTasksData.length > 0) {
			groupedTasksByWeek = myTasksData.reduce((acc, task) => {
				const taskDate = new Date(task.taskStartDate);
				const weekNumber = getWeekNumber(taskDate);
				if (!acc[weekNumber]) {
					acc[weekNumber] = [];
				}
				acc[weekNumber].push(task);
				return acc;
			}, {});
		}
	}

	// Function to toggle view mode
	function toggleViewMode(mode) {
		viewMode.set(mode);
	}
</script>

<div class="flex w-full items-center justify-between">
	<div class="text-md font-bold text-black">My Activities</div>
	<div class="flex items-center gap-3">
		<div class="text-sm font-bold text-gray-500">{formattedDate}</div>
	</div>
</div>

<div class="flex w-full items-center justify-between p-2">
	<div class="text-xl font-bold text-black">Home</div>
	<div class="flex items-center gap-3">
		<!-- Day/Week Toggle -->
		<div class="flex items-center rounded-full bg-gray-200 p-0 shadow-md">
			<button
				on:click={() => viewMode.set('day')}
				class="rounded-full px-5 py-2 text-sm font-semibold transition-all
        {$viewMode === 'day' ? 'bg-[#868698] text-white shadow' : 'text-gray-500'}"
			>
				Day
			</button>
			<button
				on:click={() => viewMode.set('week')}
				class="rounded-full px-5 py-2 text-sm font-semibold transition-all
        {$viewMode === 'week' ? 'bg-[#868698] text-white shadow' : 'text-gray-500'}"
			>
				Week
			</button>
		</div>
		<div class="flex items-center rounded-full bg-gray-200 p-0 shadow-md">
			<button
				on:click={() => viewStyle.set('default')}
				class="rounded-full px-5 py-2 text-sm font-semibold transition-all
      {$viewStyle === 'default' ? 'bg-[#868698] text-white shadow' : 'text-gray-500'}"
			>
				<!-- Custom Icon for Default View -->
				<List />
			</button>
			<button
				on:click={() => viewStyle.set('condensed')}
				class="rounded-full px-5 py-2 text-sm font-semibold transition-all
      {$viewStyle === 'condensed' ? 'bg-[#868698] text-white shadow' : 'text-gray-500'}"
			>
				<!-- Custom Icon for Condensed View -->
				<Grid />
			</button>
		</div>

		<div>
			<AddTask />
		</div>
	</div>
</div>

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
	class="scroll-snap-x-mandatory flex w-full gap-5 overflow-x-auto"
>
	{#if $viewMode === 'day' && Object.keys(groupedTasks).length > 0}
		{#each Object.keys(groupedTasks) as date (date)}
			<div
				class="scroll-snap-align-start flex w-1/3 flex-shrink-0 flex-col gap-4 rounded-md bg-white p-3 shadow"
			>
				<!-- Card Content -->
				<div class="mb-1 flex flex-col gap-2 px-2">
					<h2 class="mb-2 text-sm font-bold text-black">
						{formatDate(date)}
						<span
							class="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full
                            {groupedTasks[date].every((task) => task.completed)
								? 'bg-white'
								: 'bg-[#F5F6FD]'}
                            text-xs font-semibold text-gray-500"
						>
							{groupedTasks[date].length}
						</span>
					</h2>

					{#each groupedTasks[date] as task (task.id)}
						{#if $viewStyle === 'default'}
							<!-- Default Task View -->
							<div
								class="relative mb-1 flex rounded-md p-2 shadow {task.completed
									? 'bg-white'
									: 'bg-[#F5F6FD]'}"
							>
								<!-- Ellipses button at top-right -->
								<div class="absolute right-1 top-2">
									<button
										on:click={() => toggleOptions(task.id)}
										class="h-5 w-5 text-gray-500 hover:text-gray-800"
										aria-label="Open task options"
									>
										<DotsVertical />
									</button>

									{#if showOptionsForTask === task.id}
										<!-- Want to be able to click anywhere outside of the options and it will close -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											bind:this={dropdownRef}
											use:clickOutside={() => (showOptionsForTask = null)}
											class="absolute right-0 z-50 mt-2 w-32 rounded-md bg-white shadow-lg"
										>
											<ul>
												<li>
													<EditTask newTask={task} customDuration={task.taskDuration} />
												</li>
												<li>
													<button
														class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
														on:click={() => deleteTask(task.id)}
													>
														Delete
													</button>
												</li>
											</ul>
										</div>
									{/if}
								</div>

								<div class="flex items-center gap-2 border-l-2 border-red-600 px-2">
									<input
										type="checkbox"
										bind:checked={task.completed}
										on:change={() => toggleTaskCompletion(task)}
										class="h-4 w-4 appearance-none rounded-sm border-none bg-[#E2DCFD] outline-none checked:bg-[#5042A5] focus:ring-0"
									/>

									<div class="flex-grow">
										<h3 class="text-lg font-semibold">{task.title || 'Untitled Task'}</h3>
										<p class="text-sm text-gray-600">
											{task.description || 'No description provided.'}
										</p>
										<p class="text-sm text-gray-500">
											<span class="flex gap-1">
												{@html getPriorityIndicator(task.priority)}
											</span>
										</p>
									</div>
								</div>

								{#if task.taskStartTime}
									<span
										class="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-500"
									>
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
									on:change={() => toggleTaskCompletion(task)}
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
								<!-- Priority Colors -->
								<div class="ml-2">
									<span class="flex gap-1">
										{@html getPriorityIndicator(task.priority)}
									</span>
								</div>

								<!-- Ellipses button -->
								<div class="ml-2">
									<button
										on:click={() => toggleOptions(task.id)}
										class="h-5 w-5 text-gray-500 hover:text-gray-800"
									>
										<DotsVertical />
									</button>
									{#if showOptionsForTask === task.id}
										<!-- Want to be able to click anywhere outside of the options and it will close -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											bind:this={dropdownRef}
											use:clickOutside={() => (showOptionsForTask = null)}
											class="absolute right-0 z-50 mt-2 w-32 rounded-md bg-white shadow-lg"
										>
											<ul>
												<li>
													<EditTask newTask={task} customDuration={task.taskDuration} />
												</li>
												<li>
													<button
														class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
														on:click={() => deleteTask(task.id)}
													>
														Delete
													</button>
												</li>
											</ul>
										</div>
									{/if}
								</div>
							</div>
						{/if}
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
							{#if $viewStyle === 'default'}
								<!-- Default Task View -->
								<div
									class="relative mb-1 flex rounded-md p-2 shadow {task.completed
										? 'bg-white'
										: 'bg-[#F5F6FD]'}"
								>
									<!-- Ellipses button -->
									<div class="absolute right-1 top-2">
										<button
											on:click={() => toggleOptions(task.id)}
											class="h-5 w-5 text-gray-500 hover:text-gray-800"
										>
											<DotsVertical />
										</button>
										{#if showOptionsForTask === task.id}
											<!-- Want to be able to click anywhere outside of the options and it will close -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												bind:this={dropdownRef}
												use:clickOutside={() => (showOptionsForTask = null)}
												class="absolute right-0 top-full z-50 mt-2 w-32 rounded-md bg-white shadow-lg"
											>
												<ul>
													<!-- 												
												<li>
													<button
														class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
														on:click={() => editTask(task.id)}
													>
														Edit
													</button>
												</li> -->
													<li>
														<EditTask newTask={task} customDuration={task.taskDuration} />
													</li>
													<li>
														<button
															class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
															on:click={() => deleteTask(task.id)}
														>
															Delete
														</button>
													</li>
												</ul>
											</div>
										{/if}
									</div>

									<!-- Task Content -->
									<div class="flex items-center gap-2 border-l-2 border-red-600 px-2">
										<input
											type="checkbox"
											bind:checked={task.completed}
											on:change={() => toggleTaskCompletion(task)}
											class="h-4 w-4 appearance-none rounded-sm border-none bg-[#E2DCFD] outline-none checked:bg-[#5042A5] focus:ring-0"
										/>

										<div class="flex-grow">
											<h3 class="text-lg font-semibold">{task.title || 'Untitled Task'}</h3>
											<p class="text-sm text-gray-600">
												{task.description || 'No description provided.'}
											</p>
											<p class="text-sm text-gray-500">
												<span class="flex gap-1">
													{@html getPriorityIndicator(task.priority)}
												</span>
											</p>
										</div>
									</div>

									{#if task.taskStartTime}
										<span
											class="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-500"
										>
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
										on:change={() => toggleTaskCompletion(task)}
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

									<!-- Priority Colors -->
									<div class="ml-2">
										<span class="flex gap-1">
											{@html getPriorityIndicator(task.priority)}
										</span>
									</div>

									<!-- Ellipses button -->
									<div class="ml-2">
										<button
											on:click={() => toggleOptions(task.id)}
											class="h-5 w-5 text-gray-500 hover:text-gray-800"
										>
											<DotsVertical />
										</button>
										{#if showOptionsForTask === task.id}
											<!-- Want to be able to click anywhere outside of the options and it will close -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												bind:this={dropdownRef}
												use:clickOutside={() => (showOptionsForTask = null)}
												class="absolute right-0 top-full z-50 mt-2 w-32 rounded-md bg-white shadow-lg"
											>
												<ul>
													<!-- 												
												<li>
													<button
														class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
														on:click={() => editTask(task.id)}
													>
														Edit
													</button>
												</li> -->
													<li>
														<EditTask newTask={task} customDuration={task.taskDuration} />
													</li>
													<li>
														<button
															class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
															on:click={() => deleteTask(task.id)}
														>
															Delete
														</button>
													</li>
												</ul>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-500">No tasks available.</p>
	{/if}
</div>

<style>
	.flex-col {
		display: flex;
		flex-direction: column; /* Stack cards vertically */
		flex-wrap: wrap; /* Allow wrapping into new columns */
		gap: 1rem; /* Adjust the gap between cards */
	}
	.scroll-snap-x-mandatory {
		scroll-snap-type: x mandatory; /* Enable horizontal scroll snapping */
		overflow-x: auto; /* Enable horizontal scrolling */
		display: flex; /* Use flexbox for layout */
		gap: 1rem; /* Add spacing between cards */
		user-select: none; /* Prevent text selection while dragging */
		scroll-behavior: smooth; /* Enable smooth scrolling */
	}

	.scroll-snap-x-mandatory:active {
		cursor: grabbing; /* Show grabbing cursor while dragging */
	}

	.scroll-snap-align-start {
		scroll-snap-align: start; /* Snap to the start of each card */
		flex: 0 0 calc(33.333% - 1rem); /* Ensure each card takes up one-third of the container */
	}

	/* Hide scrollbar */
	.scroll-snap-x-mandatory::-webkit-scrollbar {
		display: none;
	}

	.scroll-snap-x-mandatory {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
