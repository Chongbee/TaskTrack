<script>
	import { onMount } from 'svelte';
	import Clock from '$lib/icons/Clock.svelte';
	import Grid from '$lib/icons/Grid.svelte';
	import List from '$lib/icons/List.svelte';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';

	// Mock data for productivity stats
	let productivityStats = {
		tasksCompleted: 12,
		totalTasks: 20,
		focusTime: '2h 45m',
		productivityScore: 78
	};

	// Mock data for weekly productivity
	let weeklyProductivity = [
		{ day: 'Mon', tasksCompleted: 3, focusTime: '45m' },
		{ day: 'Tue', tasksCompleted: 5, focusTime: '1h 30m' },
		{ day: 'Wed', tasksCompleted: 4, focusTime: '1h 15m' },
		{ day: 'Thu', tasksCompleted: 6, focusTime: '2h 0m' },
		{ day: 'Fri', tasksCompleted: 2, focusTime: '30m' },
		{ day: 'Sat', tasksCompleted: 1, focusTime: '15m' },
		{ day: 'Sun', tasksCompleted: 0, focusTime: '0m' }
	];

	// Mock data for top tasks
	let topTasks = [
		{ title: 'Design Dashboard', priority: 'High', timeSpent: '1h 30m' },
		{ title: 'Write Report', priority: 'Medium', timeSpent: '45m' },
		{ title: 'Fix Bugs', priority: 'Low', timeSpent: '30m' }
	];
</script>

<div class="p-6">
	<!-- Page Header -->
	<div class="flex w-full items-center justify-between">
		<div class="text-xl font-bold text-black">Productivity</div>
		<div class="flex items-center gap-3">
			<div class="text-sm font-bold text-gray-500">Weekly Overview</div>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Tasks Completed -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Tasks Completed</div>
			<div class="mt-2 text-2xl font-bold text-black">
				{productivityStats.tasksCompleted}/{productivityStats.totalTasks}
			</div>
			<div class="mt-2 h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-[#5042A5]"
					style={`width: ${(productivityStats.tasksCompleted / productivityStats.totalTasks) * 100}%`}
				></div>
			</div>
		</div>

		<!-- Focus Time -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Focus Time</div>
			<div class="mt-2 text-2xl font-bold text-black">{productivityStats.focusTime}</div>
			<div class="mt-2 flex items-center gap-1 text-sm text-gray-500">
				<Clock class="h-4 w-4" />
				<span>Total time spent</span>
			</div>
		</div>

		<!-- Productivity Score -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Productivity Score</div>
			<div class="mt-2 text-2xl font-bold text-black">
				{productivityStats.productivityScore}/100
			</div>
			<div class="mt-2 h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-[#5042A5]"
					style={`width: ${productivityStats.productivityScore}%`}
				></div>
			</div>
		</div>

		<!-- Top Task -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Top Task</div>
			<div class="mt-2 text-xl font-bold text-black">{topTasks[0].title}</div>
			<div class="mt-2 text-sm text-gray-500">
				<span class="font-semibold">{topTasks[0].timeSpent}</span> spent
			</div>
		</div>
	</div>

	<!-- Weekly Productivity Chart -->
	<div class="mt-6 rounded-md bg-white p-4 shadow">
		<div class="text-lg font-bold text-black">Weekly Productivity</div>
		<div class="mt-4 flex gap-4">
			{#each weeklyProductivity as day}
				<div class="flex flex-1 flex-col items-center">
					<div class="text-sm font-semibold text-gray-500">{day.day}</div>
					<div class="mt-2 h-24 w-full rounded-lg bg-[#F5F6FD]">
						<div
							class="w-full rounded-lg bg-[#5042A5]"
							style={`height: ${(day.tasksCompleted / 6) * 100}%`}
						></div>
					</div>
					<div class="mt-2 text-sm text-gray-500">{day.focusTime}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Top Tasks List -->
	<div class="mt-6 rounded-md bg-white p-4 shadow">
		<div class="text-lg font-bold text-black">Top Tasks</div>
		<div class="mt-4 space-y-2">
			{#each topTasks as task}
				<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
					<div class="flex items-center gap-2">
						<div class="text-lg font-semibold text-black">{task.title}</div>
						<div class="text-sm text-gray-500">{task.priority}</div>
					</div>
					<div class="flex items-center gap-2 text-sm text-gray-500">
						<Clock class="h-4 w-4" />
						<span>{task.timeSpent}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.grid {
		display: grid;
	}
</style>
