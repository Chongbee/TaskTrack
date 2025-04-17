<script>
	// @ts-nocheck
	import { taskHandlers } from '$lib/stores/taskStore.js';
	import { userHandlers, userStore } from '$lib/stores/userStore.js';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { Button, Modal } from 'flowbite-svelte';
	import { authStore } from '$lib/stores/authStore';
	import Template from '$lib/icons/Template.svelte';
	import Close from '$lib/icons/Close.svelte';
	import Frequency from '$lib/icons/Frequency.svelte';
	import Clock from '$lib/icons/Clock.svelte';
	import Calender from '$lib/icons/Calender.svelte';
	import Alarm from '$lib/icons/Alarm.svelte';
	import Flag from '$lib/icons/Flag.svelte';
	import Hourglass from '$lib/icons/Hourglass.svelte';

	export let show = false;
	let showDurationModal = false;
	let showPopup = false; // Control popup visibility
	let popupTimeout; // Handle popup auto-dismiss
	let remainingTime = 5; // Timer for popup countdown
	let interval;
	let isLoading = false;
	let customDuration = '00:00';
	let selectedDuration = ''; // Holds selected template duration

	let newTask = {
		title: '',
		description: '',
		completed: false,
		taskCategory: 'Home',
		priority: 'Low',
		taskStartTime: '',
		taskStartDate: '',
		taskDuration: '',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		frequency: 'None',
		reminders: ''
	};

	let user = null;
	let lastAddedTaskId = null; // Store last task ID for undo

	userStore.subscribe((curr) => {
		user = curr?.currentUser;
	});

	const setDuration = (time) => {
		let hours = 0;
		let minutes = 0;

		if (time.includes('h')) {
			// Handle hours (e.g., "1 h", "2 h")
			hours = parseInt(time.split(' ')[0], 10);
		} else if (time.includes('m')) {
			// Handle minutes (e.g., "5 m", "10 m")
			minutes = parseInt(time.split(' ')[0], 10);
		}

		// Convert to HH:mm format
		newTask.taskDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
		selectedDuration = time; // Store the selected duration in the variable
	};

	// Function to trigger popup
	const triggerPopup = (taskId) => {
		lastAddedTaskId = taskId;
		showPopup = true;
		remainingTime = 5;

		// Clear existing timers
		clearTimeout(popupTimeout);
		clearInterval(interval);

		// Start countdown timer
		interval = setInterval(() => {
			remainingTime--;
			if (remainingTime <= 0) {
				clearInterval(interval);
				showPopup = false;
			}
		}, 1000);

		// Auto-hide popup after 5 seconds
		popupTimeout = setTimeout(() => {
			showPopup = false;
		}, 5000);
	};

	// Function to undo task addition
	const undoTaskAddition = async () => {
		if (lastAddedTaskId && user) {
			await taskHandlers.deleteTask(user.uid, lastAddedTaskId);
			lastAddedTaskId = null;
			showPopup = false;
			clearInterval(interval);
		}
	};

	// Function to add task
	const addTask = async () => {
		if (!user) {
			alert('You need to be logged in to add a task.');
			return;
		}

		try {
			isLoading = true; // Show loading state

			// Create the task with all required fields including userId
			const taskId = await taskHandlers.createTask(user.uid, {
				...newTask,
				userId: user.uid, // Add this line to associate task with user
				taskStartDate: newTask.taskStartDate || new Date().toISOString(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				completed: false // Ensure default value
			});

			// Add the task ID to the user's task list
			await userHandlers.addTaskToUser(user.uid, taskId);

			// Reset the task form
			newTask = {
				title: '',
				description: '',
				completed: false,
				taskCategory: 'Home',
				priority: 'Low',
				taskStartTime: '',
				taskStartDate: '',
				taskDuration: '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				frequency: 'None',
				reminders: ''
			};

			show = false;
			triggerPopup(taskId);
		} catch (error) {
			console.error('Error adding task:', error);
			alert('Failed to add task. Please try again.');
		} finally {
			isLoading = false; // Hide loading state
		}
	};

	// Function to handle hours input change
	const handleCustomHoursChange = (event) => {
		let hours = event.target.value;
		hours = Math.min(Math.max(hours, 0), 12); // Limit to 0-12
		hours = String(hours).padStart(2, '0');
		const [_, minutes] = customDuration.split(':');
		customDuration = `${hours}:${String(minutes).padStart(2, '0')}`;
	};

	// Function to handle minutes input change
	const handleCustomMinutesChange = (event) => {
		let minutes = event.target.value;
		minutes = Math.min(Math.max(minutes, 0), 59); // Limit to 0-59
		minutes = String(minutes).padStart(2, '0');
		const [hours, _] = customDuration.split(':');
		customDuration = `${String(hours).padStart(2, '0')}:${minutes}`;
	};

	const saveDuration = () => {
		if (selectedDuration) {
			// If a template duration is selected, use the converted format
			newTask.taskDuration = newTask.taskDuration; // Already in HH:mm format
		} else {
			// If a custom duration is entered, use it directly
			newTask.taskDuration = customDuration;
		}
		showDurationModal = false; // Close the duration modal
	};
</script>

<!-- Popup Notification -->
{#if showPopup}
	<div
		class="fixed bottom-4 left-4 flex animate-[fadeIn_0.3s_ease-out] items-center gap-4 rounded-lg bg-white p-4 shadow-md"
	>
		<span class="text-gray-900">Task added successfully</span>
		<div class="flex items-center gap-2">
			<div class="relative h-[50px] w-[50px]">
				<div class="absolute h-full w-full rounded-full border-4 border-gray-300"></div>
				<div
					class="absolute h-full w-full rounded-full border-4 border-[#7262D1]"
					style="background: conic-gradient(#7262D1 0% {remainingTime *
						20}%, #e0e0e0 {remainingTime * 20}% 100%);"
				></div>
				<span
					class="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-600"
					>{remainingTime}</span
				>
			</div>
			<button
				class="rounded-full bg-[#7262D1] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#5b4bcf]"
				on:click={undoTaskAddition}>Undo</button
			>
			<button class="text-gray-500 hover:text-gray-900" on:click={() => (showPopup = false)}>
				<Close class="h-5 w-5" />
			</button>
		</div>
	</div>
{/if}

<!-- Set Duration Modal Positioned to the Left of Add Task -->
<div class="fixed bottom-4 right-4 z-50 flex gap-4">
	<!-- Duration Modal -->
	{#if showDurationModal}
		<div
			class="absolute bottom-0 left-[-270px] z-[60] max-h-[300px] w-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-lg"
		>
			<button
				type="button"
				class="absolute right-2 top-2 text-gray-500"
				on:click={() => (showDurationModal = false)}
			>
				<Close className="h-5 w-5" />
			</button>

			<h2 class="text-medium mb-4 font-bold text-gray-400">Set duration</h2>
			<div class="space-y-2">
				<div class="flex flex-wrap gap-2">
					<div class="flex items-center justify-center">
						<Template className="h-5 w-5" />
					</div>
					<div class="flex items-center justify-center">
						<h3 class="text-sm font-bold text-gray-500">Templates</h3>
					</div>
					{#each ['5 m', '10 m', '15 m', '30 m', '1 h', '2 h'] as time}
						<button
							type="button"
							class="rounded-full px-4 py-2 text-sm font-medium"
							class:bg-gray-500={selectedDuration === time}
							class:bg-gray-200={selectedDuration !== time}
							on:click={() => setDuration(time)}
						>
							{time}
						</button>
					{/each}
				</div>
			</div>

			<div class="mt-4">
				<h3 class="mb-4 text-xs font-bold text-gray-400">Or Enter Manually</h3>
				<div class="flex items-center gap-2">
					<div class="flex flex-col items-center">
						<input
							type="number"
							min="0"
							max="12"
							value={customDuration.split(':')[0]}
							class="w-16 rounded-md border border-gray-300 p-2 text-center font-sans text-xl font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
							on:input={handleCustomHoursChange}
							id="hours"
						/>
					</div>
					<div class="flex flex-col items-center justify-center gap-1">
						<span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
						<span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
					</div>
					<div class="flex flex-col items-center">
						<input
							type="number"
							min="0"
							max="59"
							value={customDuration.split(':')[1]}
							class="w-16 rounded-md border border-gray-300 p-2 text-center font-sans text-xl font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
							on:input={handleCustomMinutesChange}
							id="minutes"
						/>
					</div>
				</div>
				<div class="mt-1 flex">
					<div class="flex w-16 justify-start text-xs text-gray-500">
						<span class="block text-center">Hours</span>
					</div>
					<div class="flex w-16 justify-start pl-6 text-xs text-gray-500">
						<span class="block text-center">Minutes</span>
					</div>
				</div>
			</div>

			<button
				type="button"
				class="mt-4 w-full rounded-2xl bg-[#7262D1] py-3 font-semibold text-white transition hover:bg-[#5b4bcf]"
				on:click={saveDuration}
			>
				Set Duration
			</button>
		</div>
	{/if}

	<!-- Task Modal -->
	{#if show}
		<div
			class="max-h-[80vh] w-96 flex-col overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
		>
			<div class="flex justify-end">
				<button
					type="button"
					on:click={() => (show = false)}
					class="right-2 top-2 text-lg text-gray-500"
				>
					<Close className="h-5 w-5" />
				</button>
			</div>

			<h2 class="text-medium mb-4 font-bold text-gray-400">Add New Task</h2>
			<hr class="my-6 border-t border-gray-200" />
			<form class="space-y-4">
				<!-- Activity Type -->
				<div class="flex items-center justify-between">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-sm font-medium text-gray-600" style="font-weight: bold;"
						>Choose activity type</label
					>
					<select
						id="activity-type"
						bind:value={newTask.taskCategory}
						class="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						<option value="Home">🏠 Home</option>
						<option value="Work">💼 Work</option>
						<option value="Sport">🏋️‍♂️ Sport</option>
						<option value="Personal">👤 Personal</option>
						<option value="Courses">📚 Courses</option>
					</select>
				</div>

				<!-- Task Title -->
				<input
					type="text"
					placeholder="Task title"
					bind:value={newTask.title}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
					required
				/>

				<!-- Task Description -->
				<textarea
					placeholder="Task description"
					bind:value={newTask.description}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
					required
				></textarea>

				<!-- Priority -->
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-gray-600">
						<div class="flex items-center gap-2">
							<Flag class="h-4 w-4 text-gray-600" />
							<span>Set priority</span>
						</div>
					</label>
					<div class="flex gap-2">
						<!-- High Priority Button -->
						<button
							type="button"
							class="rounded-full px-4 py-2 text-sm font-medium"
							class:bg-red-300={newTask.priority === 'High'}
							class:bg-gray-100={newTask.priority !== 'High'}
							on:click={() => (newTask.priority = 'High')}
						>
							High
						</button>

						<!-- Medium Priority Button -->
						<button
							type="button"
							class="rounded-full px-4 py-2 text-sm font-medium"
							class:bg-yellow-300={newTask.priority === 'Medium'}
							class:bg-gray-100={newTask.priority !== 'Medium'}
							on:click={() => (newTask.priority = 'Medium')}
						>
							Med
						</button>

						<!-- Low Priority Button -->
						<button
							type="button"
							class="rounded-full px-4 py-2 text-sm font-medium"
							class:bg-green-300={newTask.priority === 'Low'}
							class:bg-gray-100={newTask.priority !== 'Low'}
							on:click={() => (newTask.priority = 'Low')}
						>
							Low
						</button>
					</div>
				</div>

				<!-- Set Date -->
				<label class="block text-sm font-medium text-gray-600">
					<div class="flex items-center gap-2">
						<Calender class="h-4 w-4 text-gray-600" />
						<span>Set date</span>
					</div>
				</label>
				<input
					type="date"
					bind:value={newTask.taskStartDate}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>

				<!-- Set Time -->
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label class="block text-sm font-medium text-gray-600">
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-gray-600" />
						<span>Start time</span>
					</div>
				</label>
				<input
					type="time"
					bind:value={newTask.taskStartTime}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>

				<!-- Duration -->
				<button
					type="button"
					class="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium"
					on:click={() => (showDurationModal = true)}
					><div class="flex items-center gap-2">
						<Hourglass class="h-4 w-4 text-gray-600" />
						Set Duration
					</div>
				</button>

				<!-- Frequency -->
				<label class="block text-sm font-medium text-gray-600">
					<div class="flex items-center gap-2">
						<Frequency class="h-4 w-4 text-gray-600" />
						<span>Frequency</span>
					</div>
				</label>

				<select
					bind:value={newTask.frequency}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				>
					<option value="None">None</option>
					<option value="Daily">Daily</option>
					<option value="Weekly">Weekly</option>
					<option value="Bi-weekly">Bi-weekly</option>
				</select>

				<!-- Reminders -->
				<label class="block text-sm font-medium text-gray-600">
					<div class="flex items-center gap-2">
						<Alarm class="h-4 w-4 text-gray-600" />
						<span>Reminders</span>
					</div>
				</label>
				<select
					bind:value={newTask.reminders}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				>
					<option value="Before 10 min">Before 10 min</option>
					<option value="Before 30 min">Before 30 min</option>
					<option value="Before 60 min">Before 60 min</option>
				</select>

				<!-- Add Task Button -->
				<button
					on:click={addTask}
					type="button"
					class="w-full rounded-2xl bg-[#7262D1] py-3 font-semibold text-white transition hover:bg-[#5b4bcf]"
					disabled={isLoading}
				>
					{isLoading ? 'Adding Task...' : 'Add task'}
				</button>
			</form>
		</div>
	{/if}
</div>
