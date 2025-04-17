<script>
	import { onMount, tick } from 'svelte';
	import { taskStore, taskHandlers } from '$lib/stores/taskStore';
	import AddTask from '$lib/components/AddTask.svelte';
	import { goto } from '$app/navigation';
	import Clock from '$lib/icons/Clock.svelte';
	import { authStore } from '$lib/stores/authStore';
	import AddTaskD from '$lib/components/AddTaskD.svelte';

	// Chart.js will be loaded dynamically
	let Chart;
	let chartInstance = null;
	let chartLoading = false;
	let chartError = null;

	// Modal state
	let showAddTaskModal = false;
	let showAnalyticsModal = false;

	// Quick actions
	const quickActions = [
		{
			icon: '📝',
			title: 'Add Task',
			action: () => (showAddTaskModal = true) // This will directly open the modal
		},
		{ icon: '📅', title: 'Schedule', action: () => goto('/calendar') },
		{ icon: '📊', title: 'Analytics', action: () => showAnalytics() }
	];

	// Reactive data
	let productivityInsights = {
		tasksCompleted: 0,
		totalTasks: 0,
		productivityScore: 0
	};

	let userTasks = [];
	let recentActivity = [];
	let tasksLoading = true;

	// Function to get priority classes
	function getPriorityClasses(priority) {
		const p = priority?.toLowerCase();
		if (p === 'high') return 'bg-red-100 text-red-800';
		if (p === 'medium') return 'bg-yellow-100 text-yellow-800';
		return 'bg-gray-100 text-gray-800';
	}

	// Update metrics whenever tasks change
	$: {
		if ($authStore.currentUser && $taskStore.tasks) {
			userTasks = $taskStore.tasks.filter((task) => task.userId === $authStore.currentUser.uid);
			updateMetrics();
		}
	}

	// Get top 3 high priority tasks due soonest
	function getPriorityTasks() {
		if (!userTasks.length) return [];

		const priorityOrder = { high: 1, medium: 2, low: 3 };

		return userTasks
			.filter((task) => !task.completed)
			.sort((a, b) => {
				// Sort by priority first
				const priorityDiff =
					priorityOrder[a.priority?.toLowerCase()] - priorityOrder[b.priority?.toLowerCase()];
				if (priorityDiff !== 0) return priorityDiff;

				// Then by due date (soonest first)
				const aDate = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
				const bDate = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
				return aDate - bDate;
			})
			.slice(0, 3);
	}

	// Format time ago
	function formatTimeAgo(dateString) {
		try {
			const date = new Date(dateString);
			const now = new Date();
			const seconds = Math.floor((now - date) / 1000);

			if (seconds < 60) return `${seconds} seconds ago`;
			if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
			if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
			return `${Math.floor(seconds / 86400)} days ago`;
		} catch (e) {
			console.error('Error formatting date:', e);
			return 'recently';
		}
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

	// Show analytics modal
	async function showAnalytics() {
		if (!Chart) {
			Chart = await loadChartJS();
			if (!Chart) return;
		}

		showAnalyticsModal = true;
		await tick(); // Wait for the modal to render
		initChart();
	}

	// Initialize chart
	function initChart() {
		try {
			if (chartInstance) {
				chartInstance.destroy();
			}

			const ctx = document.getElementById('productivityChart');
			if (!ctx) return;

			// Get last 7 days including today
			const days = [];
			for (let i = 6; i >= 0; i--) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				days.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
			}

			// Count completed tasks per day
			const completedCounts = days.map((day) => {
				return userTasks.filter(
					(task) => task.completed && task.completedAt && task.completedAt.includes(day)
				).length;
			});

			// Short day names for labels (Mon, Tue, etc.)
			const dayLabels = days.map((date) => {
				return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
			});

			chartInstance = new Chart(ctx, {
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
		} catch (error) {
			console.error('Chart error:', error);
			chartError = 'Could not load chart';
		}
	}

	// Update productivity metrics
	function updateMetrics() {
		try {
			const totalTasks = userTasks.length;
			const completedTasks = userTasks.filter((task) => task.completed).length;
			const productivityScore =
				totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

			productivityInsights = {
				tasksCompleted: completedTasks,
				totalTasks: totalTasks,
				productivityScore: productivityScore
			};

			recentActivity = userTasks
				.filter((task) => task.completed && task.completedAt)
				.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
				.slice(0, 3)
				.map((task) => ({
					action: `Completed "${task.title}"`,
					time: formatTimeAgo(task.completedAt)
				}));
		} catch (error) {
			console.error('Error updating metrics:', error);
		}
	}

	// Load initial data
	onMount(async () => {
		try {
			tasksLoading = true;
			await taskHandlers.getTasks();
			updateMetrics();
		} catch (error) {
			console.error('Error loading tasks:', error);
		} finally {
			tasksLoading = false;
		}

		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});
</script>

<!-- Main Content -->
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
			<button
				on:click={action.action}
				class="flex items-center gap-4 rounded-md bg-white p-4 shadow transition-colors hover:bg-gray-50"
			>
				<div class="text-2xl">{action.icon}</div>
				<div>
					<div class="text-lg font-bold text-black">{action.title}</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Task Summary -->
	<div class="mt-6 rounded-md bg-white p-4 shadow">
		<div class="text-lg font-bold text-black">Priority Tasks (Due Soonest)</div>
		{#if tasksLoading}
			<div class="p-4 text-center text-gray-500">Loading tasks...</div>
		{:else if userTasks.length === 0}
			<div class="p-4 text-center text-gray-500">No tasks found. Create one to get started!</div>
		{:else}
			<div class="mt-4 space-y-2">
				{#each getPriorityTasks() as task (task.id)}
					<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								checked={task.completed}
								on:change={async () => {
									const newCompletedState = !task.completed;
									try {
										await taskHandlers.updateTask(task.id, {
											completed: newCompletedState,
											completedAt: newCompletedState ? new Date().toISOString() : null
										});
									} catch (error) {
										console.error('Failed to update task:', error);
									}
								}}
								class="h-4 w-4 appearance-none rounded-sm border-none bg-[#E2DCFD] outline-none checked:bg-[#5042A5] focus:ring-0"
							/>
							<div class="flex flex-col">
								<div class="text-lg font-semibold text-black">{task.title}</div>
								<div class="flex gap-2">
									<span
										class="rounded px-2 py-0.5 text-sm font-medium {getPriorityClasses(
											task.priority
										)}"
									>
										{task.priority}
									</span>
									{#if task.dueDate}
										<span class="text-sm text-gray-500">
											Due: {new Date(task.dueDate).toLocaleDateString()}
										</span>
									{/if}
								</div>
							</div>
						</div>
						{#if task.timeEstimate}
							<div class="flex items-center gap-2 text-sm text-gray-500">
								<Clock class="h-4 w-4" />
								<span>{task.timeEstimate}</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Productivity Insights -->
	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<!-- Tasks Completed -->
		<div class="rounded-md bg-white p-4 shadow">
			<div class="text-sm font-semibold text-gray-500">Tasks Completed</div>
			<div class="mt-2 text-2xl font-bold text-black">
				{productivityInsights.tasksCompleted}/{productivityInsights.totalTasks}
			</div>
			<div class="mt-2 h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-[#5042A5]"
					style={`width: ${
						productivityInsights.totalTasks > 0
							? (productivityInsights.tasksCompleted / productivityInsights.totalTasks) * 100
							: 0
					}%`}
				></div>
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
			{#if recentActivity.length > 0}
				{#each recentActivity as activity}
					<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
						<div class="text-sm text-gray-500">
							{activity.action}
						</div>
						<div class="text-sm text-gray-500">{activity.time}</div>
					</div>
				{/each}
			{:else}
				<div class="p-4 text-center text-gray-500">
					{tasksLoading ? 'Loading...' : 'No recent activity yet'}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Analytics Modal -->
{#if showAnalyticsModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
		on:click={() => (showAnalyticsModal = false)}
	>
		<div
			class="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6"
			on:click|stopPropagation
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold">Productivity Analytics</h2>
				<button
					on:click={() => (showAnalyticsModal = false)}
					class="text-gray-500 hover:text-gray-700"
				>
					✕
				</button>
			</div>

			{#if chartLoading}
				<div class="mb-2 flex h-[30rem] items-center justify-center">
					<div class="text-gray-500">Loading analytics...</div>
				</div>
			{:else if chartError}
				<div class="flex h-96 items-center justify-center">
					<div class="text-red-500">{chartError}</div>
				</div>
			{:else}
				<!-- Chart container with more space -->
				<div class="mb-1 h-[28rem] min-h-[28rem]">
					<!-- Fixed height with min-height -->
					<h3 class="mb-1 text-lg font-semibold">Weekly Completion</h3>
					<div class="h-full w-full">
						<!-- New container for proper chart sizing -->
						<canvas id="productivityChart" class="h-full w-full"></canvas>
					</div>
				</div>
			{/if}

			<div class="mt-2 grid grid-cols-2 gap-1">
				<div class="rounded bg-[#F5F6FD] p-2">
					<h4 class="text-sm font-semibold">Completed Tasks</h4>
					<p class="text-xl font-bold">{productivityInsights.tasksCompleted}</p>
				</div>
				<div class="rounded bg-[#F5F6FD] p-2">
					<h4 class="text-sm font-semibold">Total Tasks</h4>
					<p class="text-xl font-bold">{productivityInsights.totalTasks}</p>
				</div>
			</div>
		</div>
	</div>
{/if}
<AddTaskD bind:show={showAddTaskModal} />

<style>
	.grid {
		display: grid;
	}
</style>
