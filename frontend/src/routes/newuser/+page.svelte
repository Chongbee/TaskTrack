<script>
	// @ts-nocheck
	import { userHandlers, userStore } from '$lib/stores/userStore';
	import { authStore } from '$lib/stores/authStore';
	import AddTask from '$lib/components/AddTask.svelte';
	import { taskHandlers, taskStore } from '$lib/stores/taskStore';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';
	import Clock from '$lib/icons/Clock.svelte';

	let userId = null;
	let userData = null;
	let myTasks = [];
	let myTasksData = null;
	let showOptionsForTask = null; // to track which task's options are shown

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
</script>

<div class="flex w-full items-center justify-between">
	<div class="text-md font-bold text-black">My Activities</div>
	<div class="flex items-center gap-3">
		<div class="text-sm font-bold text-gray-500">{formattedDate}</div>
	</div>
</div>

<div class="flex w-full items-center justify-between">
	<div class="text-xl font-bold text-black">Home</div>
	<div class="flex items-center gap-3">
		<div>day/week</div>
		<div>view button</div>
		<div>
			<AddTask />
		</div>
	</div>
</div>

<div class="flex w-full gap-5">
	{#if Object.keys(groupedTasks).length > 0}
		{#each Object.keys(groupedTasks) as date (date)}
			<div class="flex w-1/3 flex-col gap-4 rounded-md bg-white p-3 shadow">
				<div class="mb-1 flex flex-col gap-2 px-2">
					<h2 class="mb-2 text-sm font-bold text-black">
						{formatDate(date)}
						<span
							class="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full
							{groupedTasks[date].every((task) => task.completed) ? 'bg-white' : 'bg-[#F5F6FD]'} 
							text-xs font-semibold text-gray-500"
						>
							{groupedTasks[date].length}
						</span>
					</h2>

					{#each groupedTasks[date] as task (task.id)}
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

								<!-- Dropdown options (Now appears above other tasks) -->
								{#if showOptionsForTask === task.id}
									<div class="absolute right-0 z-10 mt-2 w-32 rounded-md bg-white shadow-lg">
										<ul>
											<li>
												<button
													class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
													on:click={() => editTask(task.id)}
												>
													Edit
												</button>
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

							<!-- Start time at bottom-right -->
							{#if task.taskStartTime}
								<span
									class="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-500"
								>
									<Clock className="h-3 w-3" />
									{task.taskStartTime}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{:else}
		<p class="text-gray-500">No tasks available.</p>
	{/if}
</div>
