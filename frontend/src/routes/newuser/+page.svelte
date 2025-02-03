<script>
	// @ts-nocheck
	import { userHandlers, userStore } from '$lib/stores/userStore';
	import { authStore } from '$lib/stores/authStore';
	import AddTask from '$lib/components/AddTask.svelte'; // Import the new AddTask component

	let userID = null;
	let userData = null;
	let myTasks = [];

	// Subscribe to the auth and user store
	authStore.subscribe((curr) => {
		userID = curr?.currentUser?.uid;
	});

	userStore.subscribe((curr) => {
		userData = curr?.currentUser;
		myTasks = curr?.currentUser?.tasks || [];
	});

	// Group tasks by date
	let groupedTasks = {};

	// Update grouped tasks whenever myTasks changes
	$: {
		groupedTasks = myTasks.reduce((acc, task) => {
			const taskDate = task.setDate; // Use the setDate to group
			if (!acc[taskDate]) {
				acc[taskDate] = [];
			}
			acc[taskDate].push(task);
			return acc;
		}, {});
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
<!-- Task Input Form (Add Task Component) -->
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

<!-- Grouped Task List -->
<div class="flex w-full gap-5">
	<div class="flex w-1/3 flex-col gap-4">
		{#each Object.keys(groupedTasks) as date (date)}
			<div class="mb-1">
				<h2 class="mb-2 text-lg font-bold">{date}</h2>
				{#each groupedTasks[date] as task}
					<div class="mb-1 rounded-md bg-white p-2 shadow">
						<h3 class="text-lg font-semibold">{task.title}</h3>
						<p class="text-sm text-gray-600">{task.description}</p>
						<p class="text-sm text-gray-500">
							{task.setDate} at {task.setTime} | {task.priority} Priority
						</p>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
