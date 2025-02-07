<script>
	// @ts-nocheck
	import { userHandlers, userStore } from '$lib/stores/userStore';
	import { authStore } from '$lib/stores/authStore';
	import AddTask from '$lib/components/AddTask.svelte';
	import { taskHandlers, taskStore } from '$lib/stores/taskStore';

	let userId = null;
	let userData = null;
	let myTasks = [];
	let myTasksData = null;

	// Subscribe to auth store
	authStore.subscribe((curr) => {
		userId = curr?.currentUser?.uid;
		if (userId) {
			userHandlers.getUser(userId); // Fetch user data if logged in
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

	// Group tasks by the date part of 'createdAt'
	$: {
		if (Array.isArray(myTasksData) && myTasksData.length > 0) {
			groupedTasks = myTasksData.reduce((acc, task) => {
				if (task.taskStartDate) {
					// Extract YYYY-MM-DD format for grouping
					const taskDate = new Date(task.taskStartDate).toISOString().split('T')[0];

					if (!acc[taskDate]) {
						acc[taskDate] = [];
					}
					acc[taskDate].push(task);
				}
				return acc;
			}, {});

			console.log('groupedTasks', groupedTasks);
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return `${date.toLocaleString('en-US', { weekday: 'short' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'short' })}`;
	}

	const date = new Date();
	const formattedDate = `${date.toLocaleString('en-US', { weekday: 'long' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;
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
					<h2 class="mb-2 text-sm font-bold text-black">{formatDate(date)}</h2>
					{#each groupedTasks[date] as task (task.id)}
						<div class="mb-1 rounded-md bg-[#F5F6FD] p-2 shadow">
							<div class="border-l-2 border-red-600 px-2">
								<h3 class="text-lg font-semibold">{task.title || 'Untitled Task'}</h3>
								<p class="text-sm text-gray-600">
									{task.description || 'No description provided.'}
								</p>
								<p class="text-sm text-gray-500">
									{task.taskStartTime ? `at ${task.taskStartTime}` : 'No time'} | {task.priority ||
										'No'} Priority
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{:else}
		<p class="text-gray-500">No tasks available.</p>
	{/if}
</div>
