<script>
	import Clock from '$lib/icons/Clock.svelte';
	import Grid from '$lib/icons/Grid.svelte';
	import List from '$lib/icons/List.svelte';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';

	// Mock data for tasks
	let tasks = [
		{ id: 1, title: 'Design Dashboard', priority: 'High', completed: false, time: '1h 30m' },
		{ id: 2, title: 'Write Report', priority: 'Medium', completed: true, time: '45m' },
		{ id: 3, title: 'Fix Bugs', priority: 'Low', completed: false, time: '30m' }
	];

	// Mock data for quick actions
	let quickActions = [
		{ icon: '📝', title: 'Add Task', description: 'Create a new task' },
		{ icon: '📅', title: 'Schedule', description: 'Plan your week' },
		{ icon: '📊', title: 'Analytics', description: 'View productivity stats' }
	];

	// Mock data for productivity insights
	let productivityInsights = {
		tasksCompleted: 12,
		totalTasks: 20,
		focusTime: '2h 45m',
		productivityScore: 78
	};
</script>

<div class="p-6">
	<!-- Page Header -->
	<div class="flex w-full items-center justify-between">
		<div class="text-xl font-bold text-black">Dashboard</div>
		<div class="flex items-center gap-3">
			<div class="text-sm font-bold text-gray-500">Welcome back!</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		{#each quickActions as action}
			<div class="flex items-center gap-4 rounded-md bg-white p-4 shadow">
				<div class="text-2xl">{action.icon}</div>
				<div>
					<div class="text-lg font-bold text-black">{action.title}</div>
					<div class="text-sm text-gray-500">{action.description}</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Task Summary -->
	<div class="mt-6 rounded-md bg-white p-4 shadow">
		<div class="text-lg font-bold text-black">Task Summary</div>
		<div class="mt-4 space-y-2">
			{#each tasks as task}
				<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={task.completed}
							class="h-4 w-4 appearance-none rounded-sm border-none bg-[#E2DCFD] outline-none checked:bg-[#5042A5] focus:ring-0"
						/>
						<div class="text-lg font-semibold text-black">{task.title}</div>
						<div class="text-sm text-gray-500">{task.priority}</div>
					</div>
					<div class="flex items-center gap-2 text-sm text-gray-500">
						<Clock class="h-4 w-4" />
						<span>{task.time}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Productivity Insights -->
	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<!-- Tasks Completed -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Tasks Completed</div>
			<div class="mt-2 text-2xl font-bold text-black">
				{productivityInsights.tasksCompleted}/{productivityInsights.totalTasks}
			</div>
			<div class="mt-2 h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-[#5042A5]"
					style={`width: ${(productivityInsights.tasksCompleted / productivityInsights.totalTasks) * 100}%`}
				></div>
			</div>
		</div>

		<!-- Focus Time -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Focus Time</div>
			<div class="mt-2 text-2xl font-bold text-black">{productivityInsights.focusTime}</div>
			<div class="mt-2 flex items-center gap-1 text-sm text-gray-500">
				<Clock class="h-4 w-4" />
				<span>Total time spent</span>
			</div>
		</div>

		<!-- Productivity Score -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Productivity Score</div>
			<div class="mt-2 text-2xl font-bold text-black">
				{productivityInsights.productivityScore}/100
			</div>
			<div class="mt-2 h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-[#5042A5]"
					style={`width: ${productivityInsights.productivityScore}%`}
				></div>
			</div>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="mt-6 rounded-md bg-white p-4 shadow">
		<div class="text-lg font-bold text-black">Recent Activity</div>
		<div class="mt-4 space-y-2">
			<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
				<div class="text-sm text-gray-500">
					You completed <span class="font-semibold">Design Dashboard</span>
				</div>
				<div class="text-sm text-gray-500">2h ago</div>
			</div>
			<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
				<div class="text-sm text-gray-500">
					You added <span class="font-semibold">Write Report</span>
				</div>
				<div class="text-sm text-gray-500">4h ago</div>
			</div>
			<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
				<div class="text-sm text-gray-500">
					You updated <span class="font-semibold">Fix Bugs</span>
				</div>
				<div class="text-sm text-gray-500">1d ago</div>
			</div>
		</div>
	</div>
</div>

<style>
	.grid {
		display: grid;
	}
</style>
