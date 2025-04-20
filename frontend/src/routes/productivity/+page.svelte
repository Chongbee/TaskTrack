<script>
	//@ts-nocheck
	import { onMount, onDestroy } from 'svelte';
	import { taskStore, taskHandlers } from '$lib/stores/taskStore';
	import { authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';

	// Chart.js will be loaded dynamically
	let Chart;
	let chartLoading = false;
	let chartError = null;
	let radialChartInstance = null;
	let lineChartInstance = null;

	// Productivity metrics
	let productivityData = {
		tasksCompleted: 0,
		totalTasks: 0,
		completionRate: 0,
		recentTasks: [],
		taskDistribution: {
			high: 0,
			medium: 0,
			low: 0
		},
		statusDistribution: {
			completed: 0,
			todo: 0
		}
	};

	let userTasks = [];
	let loading = true;
	let isOpen = false;

	// Format percentage
	function formatPercent(value) {
		return Math.round(value * 100);
	}

	// Calculate productivity metrics
	function calculateMetrics() {
		if (userTasks.length === 0) return;

		const totalTasks = userTasks.length;
		const completedTasks = userTasks.filter((task) => task.completed).length;
		const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

		// Priority distribution
		const priorityCounts = userTasks.reduce(
			(acc, task) => {
				acc[task.priority?.toLowerCase() || 'low']++;
				return acc;
			},
			{ high: 0, medium: 0, low: 0 }
		);

		// Status distribution (only completed and todo)
		const statusCounts = {
			completed: completedTasks,
			todo: totalTasks - completedTasks
		};

		productivityData = {
			tasksCompleted: completedTasks,
			totalTasks: totalTasks,
			completionRate: completionRate,
			recentTasks: userTasks
				.filter((task) => task.completed)
				.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
				.slice(0, 5),
			taskDistribution: priorityCounts,
			statusDistribution: statusCounts
		};
	}

	// Load Chart.js dynamically
	async function loadChartJS() {
		try {
			chartLoading = true;
			const module = await import('chart.js/auto');
			return module.default;
		} catch (error) {
			console.error('Failed to load Chart.js:', error);
			chartError = 'Failed to load analytics. Please try again.';
			return null;
		} finally {
			chartLoading = false;
		}
	}

	// Initialize radial chart
	async function initRadialChart() {
		if (!Chart) {
			Chart = await loadChartJS();
			if (!Chart) return;
		}

		const ctx = document.getElementById('radialChart');
		if (!ctx) return;

		if (radialChartInstance) {
			radialChartInstance.destroy();
		}

		radialChartInstance = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: ['Completed', 'To Do'],
				datasets: [
					{
						data: [
							productivityData.statusDistribution.completed,
							productivityData.statusDistribution.todo
						],
						backgroundColor: [
							'#1C64F2', // blue for completed
							'#FDBA8C' // orange for to do
						],
						borderWidth: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '70%',
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							usePointStyle: true,
							padding: 20,
							boxWidth: 10
						}
					}
				},
				layout: {
					padding: {
						left: 20,
						right: 20,
						top: 0,
						bottom: 0
					}
				}
			}
		});
	}

	// Initialize line chart
	async function initLineChart() {
		if (!Chart) {
			Chart = await loadChartJS();
			if (!Chart) return;
		}

		const ctx = document.getElementById('lineChart');
		if (!ctx) return;

		// Get last 7 days including today
		const days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			days.push(date.toISOString().split('T')[0]);
		}

		// Count completed tasks per day
		const completedCounts = days.map((day) => {
			return userTasks.filter(
				(task) => task.completed && task.completedAt && task.completedAt.includes(day)
			).length;
		});

		// Short day names for labels
		const dayLabels = days.map((date) => {
			return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
		});

		if (lineChartInstance) {
			lineChartInstance.destroy();
		}

		lineChartInstance = new Chart(ctx, {
			type: 'line',
			data: {
				labels: dayLabels,
				datasets: [
					{
						label: 'Tasks Completed',
						data: completedCounts,
						borderColor: '#5042A5',
						backgroundColor: 'rgba(80, 66, 165, 0.2)',
						tension: 0.3,
						fill: true
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							stepSize: 1
						}
					}
				}
			}
		});
	}

	// Load tasks on mount
	onMount(async () => {
		try {
			loading = true;
			// Replace getTasks() with getMyTasks()
			if ($authStore.currentUser?.uid && $authStore.currentUser?.tasks) {
				await taskHandlers.getMyTasks($authStore.currentUser.tasks);
			}
			loading = false;
			await initRadialChart();
			await initLineChart();
		} catch (error) {
			console.error('Error loading tasks:', error);
			loading = false;
		}
	});

	// Clean up charts on destroy
	onDestroy(() => {
		if (radialChartInstance) {
			radialChartInstance.destroy();
		}
		if (lineChartInstance) {
			lineChartInstance.destroy();
		}
	});

	// Update when tasks change
	$: {
		if ($authStore.currentUser && $taskStore.tasks) {
			userTasks = $taskStore.tasks.filter((task) => task.userId === $authStore.currentUser.uid);
			calculateMetrics();
			if (Chart) {
				initRadialChart();
				initLineChart();
			}
		}
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Productivity Dashboard</h1>
		<div class="flex items-center space-x-2">
			<button
				on:click={() => goto('/')}
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
			>
				Back to Tasks
			</button>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Total Tasks -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">
						{productivityData.totalTasks}
					</p>
				</div>
				<div class="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-indigo-600 dark:text-indigo-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
			</div>
		</div>

		<!-- Completed Tasks -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">
						{productivityData.tasksCompleted}
					</p>
				</div>
				<div class="rounded-full bg-green-100 p-3 dark:bg-green-900">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-green-600 dark:text-green-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
			</div>
		</div>

		<!-- Completion Rate -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">
						{formatPercent(productivityData.completionRate)}%
					</p>
				</div>
				<div class="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-blue-600 dark:text-blue-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
			</div>
		</div>

		<!-- Priority Distribution -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500 dark:text-gray-400">High Priority Tasks</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">
						{productivityData.taskDistribution.high}
					</p>
				</div>
				<div class="rounded-full bg-red-100 p-3 dark:bg-red-900">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-red-600 dark:text-red-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Task Status Overview Card with Radial Chart -->
	<div class="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
		<div class="flex w-full items-start justify-between">
			<div class="flex-col items-center">
				<div class="mb-1 flex items-center">
					<h5 class="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white">
						Task Status Overview
					</h5>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
			<div class="mx-auto mb-2 grid max-w-xs grid-cols-2 gap-3">
				<dl
					class="flex h-[78px] flex-col items-center justify-center rounded-lg bg-orange-50 dark:bg-gray-600"
				>
					<dt
						class="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-medium text-orange-600 dark:bg-gray-500 dark:text-orange-300"
					>
						{productivityData.statusDistribution.todo}
					</dt>
					<dd class="text-sm font-medium text-orange-600 dark:text-orange-300">To do</dd>
				</dl>
				<dl
					class="flex h-[78px] flex-col items-center justify-center rounded-lg bg-blue-50 dark:bg-gray-600"
				>
					<dt
						class="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600 dark:bg-gray-500 dark:text-blue-300"
					>
						{productivityData.statusDistribution.completed}
					</dt>
					<dd class="text-sm font-medium text-blue-600 dark:text-blue-300">Completed</dd>
				</dl>
			</div>
			<button
				on:click={() => (isOpen = !isOpen)}
				type="button"
				class="inline-flex items-center text-xs font-medium text-gray-500 hover:underline dark:text-gray-400"
			>
				Show more details <svg
					class={`ms-1 h-2 w-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
			{#if isOpen}
				<div
					id="more-details"
					class="mt-3 space-y-2 border-t border-gray-200 pt-3 dark:border-gray-600"
				>
					<dl class="flex items-center justify-between">
						<dt class="text-sm font-normal text-gray-500 dark:text-gray-400">Completion rate:</dt>
						<dd
							class="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300"
						>
							{formatPercent(productivityData.completionRate)}%
						</dd>
					</dl>
					<dl class="flex items-center justify-between">
						<dt class="text-sm font-normal text-gray-500 dark:text-gray-400">
							High priority tasks:
						</dt>
						<dd
							class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-300"
						>
							{productivityData.taskDistribution.high}
						</dd>
					</dl>
					<dl class="flex items-center justify-between">
						<dt class="text-sm font-normal text-gray-500 dark:text-gray-400">Recent activity:</dt>
						<dd
							class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-300"
						>
							{productivityData.recentTasks.length} completed
						</dd>
					</dl>
				</div>
			{/if}
		</div>

		<!-- Chart container - centered -->
		<div class="mx-auto py-6" style="height: 300px; max-width: 400px;">
			{#if chartLoading}
				<div class="flex h-full items-center justify-center">
					<div class="text-gray-500">Loading chart...</div>
				</div>
			{:else if chartError}
				<div class="flex h-full items-center justify-center">
					<div class="text-red-500">{chartError}</div>
				</div>
			{:else}
				<canvas id="radialChart"></canvas>
			{/if}
		</div>
	</div>

	<!-- Main Content -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Completion Progress -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Task Completion</h2>
			<div class="space-y-4">
				<div>
					<div class="mb-1 flex justify-between">
						<span class="text-sm font-medium text-gray-900 dark:text-white">Progress</span>
						<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
							{formatPercent(productivityData.completionRate)}%
						</span>
					</div>
					<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
						<div
							class="h-2 rounded-full bg-indigo-600"
							style={`width: ${formatPercent(productivityData.completionRate)}%`}
						></div>
					</div>
				</div>

				<!-- Add the line chart here -->
				<div class="h-64">
					{#if chartLoading}
						<div class="flex h-full items-center justify-center">
							<div class="text-gray-500">Loading chart...</div>
						</div>
					{:else if chartError}
						<div class="flex h-full items-center justify-center">
							<div class="text-red-500">{chartError}</div>
						</div>
					{:else}
						<canvas id="lineChart"></canvas>
					{/if}
				</div>

				<div class="grid grid-cols-3 gap-4">
					<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400">High Priority</p>
						<p class="text-xl font-semibold text-gray-900 dark:text-white">
							{productivityData.taskDistribution.high}
						</p>
					</div>
					<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Medium</p>
						<p class="text-xl font-semibold text-gray-900 dark:text-white">
							{productivityData.taskDistribution.medium}
						</p>
					</div>
					<div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
						<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Low</p>
						<p class="text-xl font-semibold text-gray-900 dark:text-white">
							{productivityData.taskDistribution.low}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Recent Completed Tasks -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recently Completed</h2>
			<div class="space-y-4">
				{#if productivityData.recentTasks.length > 0}
					{#each productivityData.recentTasks as task}
						<div
							class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
						>
							<div>
								<p class="font-medium text-gray-900 dark:text-white">{task.title}</p>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{task.priority} priority
								</p>
							</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								{new Date(task.completedAt).toLocaleDateString()}
							</div>
						</div>
					{/each}
				{:else}
					<p class="text-gray-500 dark:text-gray-400">No recently completed tasks</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Task Breakdown -->
	<div class="mt-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Task Breakdown</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
				<h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">High Priority</h3>
				{#if userTasks.filter((t) => t.priority?.toLowerCase() === 'high').length > 0}
					<ul class="space-y-2">
						{#each userTasks.filter((t) => t.priority?.toLowerCase() === 'high') as task}
							<li class="flex items-center">
								<input
									type="checkbox"
									checked={task.completed}
									class="mr-2 h-4 w-4 rounded border-gray-300 bg-gray-100 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
								/>
								<span class:line-through={task.completed}>{task.title}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">No high priority tasks</p>
				{/if}
			</div>
			<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
				<h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">Medium Priority</h3>
				{#if userTasks.filter((t) => t.priority?.toLowerCase() === 'medium').length > 0}
					<ul class="space-y-2">
						{#each userTasks.filter((t) => t.priority?.toLowerCase() === 'medium') as task}
							<li class="flex items-center">
								<input
									type="checkbox"
									checked={task.completed}
									class="mr-2 h-4 w-4 rounded border-gray-300 bg-gray-100 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
								/>
								<span class:line-through={task.completed}>{task.title}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">No medium priority tasks</p>
				{/if}
			</div>
			<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
				<h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">Low Priority</h3>
				{#if userTasks.filter((t) => t.priority?.toLowerCase() === 'low').length > 0}
					<ul class="space-y-2">
						{#each userTasks.filter((t) => t.priority?.toLowerCase() === 'low') as task}
							<li class="flex items-center">
								<input
									type="checkbox"
									checked={task.completed}
									class="mr-2 h-4 w-4 rounded border-gray-300 bg-gray-100 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
								/>
								<span class:line-through={task.completed}>{task.title}</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">No low priority tasks</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Add any custom styles here if needed */
	.dark {
		color-scheme: dark;
	}
</style>
