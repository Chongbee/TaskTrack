<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import { userStore } from '$lib/stores/userStore';
	import { taskStore, taskHandlers } from '$lib/stores/taskStore';
	import { goto } from '$app/navigation';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';
	import Completed from '$lib/icons/Completed.svelte';

	// User data
	let name = '';
	let email = '';
	let bio = '';
	let phoneNumber = '';
	let profileImage = '';
	let tasksCompleted = 0;
	let totalTasks = 0;
	let recentActivity = [];

	// Calendar data
	let currentDate = new Date();
	let currentMonth = currentDate.getMonth();
	let currentYear = currentDate.getFullYear();
	let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
	let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
	let calendarGrid = [];
	let groupedTasks = {};

	// Fetch user data on mount
	onMount(async () => {
		authStore.subscribe((state) => {
			if (state.currentUser) {
				name = state.currentUser.displayName || '';
				email = state.currentUser.email || '';
				profileImage = state.currentUser.photoURL || 'https://i.imgur.com/ucsOFUO.jpeg';
			}
		});

		userStore.subscribe((state) => {
			if (state.currentUser) {
				bio = state.currentUser.description || '';
				phoneNumber = state.currentUser.phoneNumber || '';
			}
		});

		taskStore.subscribe((state) => {
			if (state.tasks) {
				totalTasks = state.tasks.length;
				tasksCompleted = state.tasks.filter((task) => task.completed).length;

				recentActivity = state.tasks
					.map((task) => ({
						action: task.completed ? `Completed "${task.title}"` : `Added "${task.title}"`,
						time: new Date(task.updatedAt || task.createdAt).toLocaleString()
					}))
					.sort((a, b) => new Date(b.time) - new Date(a.time))
					.slice(0, 5);

				groupedTasks = state.tasks.reduce((acc, task) => {
					const taskDate = new Date(task.taskStartDate).toISOString().split('T')[0];
					if (!acc[taskDate]) {
						acc[taskDate] = [];
					}
					acc[taskDate].push(task);
					return acc;
				}, {});

				updateCalendar();
			}
		});

		await taskHandlers.getTasks();
	});

	// Redirect to settings page
	function goToSettings() {
		goto('/settings');
	}

	// Calculate completion percentage
	$: completionPercentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

	// Update the calendar grid
	function updateCalendar() {
		calendarGrid = [];
		for (let i = 0; i < firstDayOfMonth; i++) {
			calendarGrid.push({ day: null, tasks: [] });
		}
		for (let day = 1; day <= daysInMonth; day++) {
			const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			const dayTasks = groupedTasks[date] || [];
			calendarGrid.push({ day, tasks: dayTasks });
		}
	}

	// Navigate to previous month
	function prevMonth() {
		currentMonth--;
		if (currentMonth < 0) {
			currentMonth = 11;
			currentYear--;
		}
		updateCalendar();
	}

	// Navigate to next month
	function nextMonth() {
		currentMonth++;
		if (currentMonth > 11) {
			currentMonth = 0;
			currentYear++;
		}
		updateCalendar();
	}
</script>

<!-- Main Container -->
<div class="flex h-screen">
	<!-- Navigation Bar (already fixed) -->
	<!-- Your Nav.svelte component is included here -->

	<!-- Profile Page Content -->
	<div class="no-scrollbar flex-1 overflow-y-auto p-6">
		<!-- Page Header with Options Button -->
		<div class="flex w-full items-center justify-between">
			<div class="text-xl font-bold text-black">Profile</div>
			<button on:click={goToSettings} class="text-gray-500 hover:text-gray-800">
				<DotsVertical class="h-6 w-6" />
			</button>
		</div>

		<!-- Profile Picture -->
		<div class="mt-6 w-full items-center rounded-lg bg-[#5042A5] p-6">
			<img
				src={profileImage}
				alt="Profile Picture"
				class="h-32 w-32 rounded-full border-4 object-cover"
			/>
		</div>

		<!-- User Information -->
		<div class="mt-6 space-y-4">
			<div>
				<label class="block text-sm font-bold text-gray-500">Name</label>
				<div class="mt-1 text-lg font-semibold text-black">{name}</div>
			</div>

			<div>
				<label class="block text-sm font-bold text-gray-500">Email</label>
				<div class="mt-1 text-lg font-semibold text-black">{email}</div>
			</div>

			<div>
				<label class="block text-sm font-bold text-gray-500">Bio</label>
				<div class="mt-1 text-lg font-semibold text-black">{bio}</div>
			</div>

			<div>
				<label class="block text-sm font-bold text-gray-500">Phone Number</label>
				<div class="mt-1 text-lg font-semibold text-black">{phoneNumber}</div>
			</div>
		</div>

		<!-- Horizontal Separator -->
		<hr class="my-6 border-t border-gray-200" />

		<!-- Task Statistics with Completion Progress Bar -->
		<div class="mt-6">
			<div class="flex items-center gap-2">
				<svg
					class="h-6 w-6 text-[#5042A5]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div class="text-lg font-bold text-black">Task Progress</div>
			</div>
			<div class="mt-2">
				<div class="flex justify-between text-sm font-bold text-gray-500">
					<span class="inline-flex items-center gap-1">
						<span>Completed</span>
						<Completed />
					</span>
					<span>{completionPercentage}%</span>
				</div>
				<div class="mt-1 h-3 w-full rounded-full bg-gray-200">
					<div
						class="h-3 rounded-full bg-[#5042A5]"
						style={`width: ${completionPercentage}%`}
					></div>
				</div>
				<div class="mt-2 text-sm text-gray-500">
					{tasksCompleted} out of {totalTasks} tasks completed
				</div>
			</div>
		</div>

		<!-- Functional Calendar -->
		<div class="mt-6 rounded-md bg-white p-4 shadow">
			<div class="flex items-center justify-between">
				<div class="text-lg font-bold text-black">
					{new Date(currentYear, currentMonth).toLocaleString('default', {
						month: 'long',
						year: 'numeric'
					})}
				</div>
				<div class="flex gap-2">
					<button on:click={prevMonth} class="rounded-md bg-[#5042A5] px-3 py-1 text-white">
						&lt;
					</button>
					<button on:click={nextMonth} class="rounded-md bg-[#5042A5] px-3 py-1 text-white">
						&gt;
					</button>
				</div>
			</div>
			<div class="mt-4 grid grid-cols-7 gap-2">
				{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
					<div class="text-center text-sm font-bold text-gray-500">{day}</div>
				{/each}

				{#each calendarGrid as cell}
					<div class="rounded-md border p-2 {cell.day ? 'bg-white' : 'bg-gray-100'}">
						{#if cell.day}
							<div class="text-sm font-bold text-black">{cell.day}</div>
							{#each cell.tasks as task}
								<div class="mt-1 rounded-md bg-[#F5F6FD] p-1 text-sm text-black">
									{task.title}
								</div>
							{/each}
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="mt-6">
			<div class="text-center text-lg font-bold text-black">Recent Activity</div>
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#if recentActivity.length > 0}
					{#each recentActivity as activity}
						<div class="rounded-md bg-[#F5F6FD] p-3">
							<div class="text-sm font-semibold text-black">{activity.action}</div>
							<div class="text-xs text-gray-500">{activity.time}</div>
						</div>
					{/each}
				{:else}
					<div class="col-span-3 text-sm text-gray-500">No recent activity.</div>
				{/if}
			</div>
		</div>
	</div>
</div>
