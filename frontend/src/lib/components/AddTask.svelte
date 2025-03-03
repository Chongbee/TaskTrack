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

	let showTaskModal = false;
	let showDurationModal = false;

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

	let customDuration = '00:00'; // Store the custom duration
	let isLoading = false;
	let taskId = '';
	let selectedDuration = ''; // Holds selected template duration

	// Function to handle selecting predefined durations
	const setDuration = (duration) => {
		if (selectedDuration === duration) {
			selectedDuration = ''; // Deselect if the same duration is clicked
			customDuration = '00:00'; // Reset to default if deselected
			newTask.taskDuration = ''; // Clear task duration
		} else {
			selectedDuration = duration;
			customDuration = duration; // Update customDuration to match the selected template
			newTask.taskDuration = duration; // Set task duration with template
		}
		showDurationModal = true; // Ensure the modal is shown when a duration is selected
	};

	// Function to handle hours input change
	const handleCustomHoursChange = (event) => {
		let hours = event.target.value;
		// Limit hours to a maximum of 12, ensure the value is a valid number
		hours = Math.min(Math.max(hours, 0), 12); // Ensures hours stay within 0-12
		// Ensure hours are always two digits
		hours = String(hours).padStart(2, '0');
		const [_, minutes] = customDuration.split(':');
		customDuration = `${hours}:${String(minutes).padStart(2, '0')}`;
	};
	// Function to handle minutes input change
	const handleCustomMinutesChange = (event) => {
		let minutes = event.target.value;
		// Limit minutes to a maximum of 59, ensure the value is a valid number
		minutes = Math.min(Math.max(minutes, 0), 59); // Ensures minutes stay within 0-59
		// Ensure minutes are always two digits
		minutes = String(minutes).padStart(2, '0');
		const [hours, _] = customDuration.split(':');
		customDuration = `${String(hours).padStart(2, '0')}:${minutes}`;
	};
	// Function to save the duration and close modal
	const saveDuration = () => {
		newTask.taskDuration = selectedDuration || customDuration; // Use selected or custom duration
		showDurationModal = false; // Close the duration modal
	};

	let user = null;
	userStore.subscribe((curr) => {
		user = curr?.currentUser;
	});

	// Function to add task
	const addTask = async () => {
		if (!user) {
			alert('You need to be logged in to add a task.');
			return;
		}

		isLoading = true;

		try {
			// Create the task and get the new task ID
			const taskId = await taskHandlers.createTask(user.uid, newTask);
			// Update user store with the new task
			userHandlers.addTaskToUser(user.uid, taskId);

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

			alert('Task added successfully!');
			showTaskModal = false; // Close modal after adding task
		} catch (error) {
			console.error('Error adding task:', error);
			alert('Failed to add task.');
		} finally {
			isLoading = false;
		}
	};
</script>

<!-- Add Task Button -->
<button
	class="rounded-full bg-[#7262D1] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#5b4bcf]"
	on:click={() => (showTaskModal = true)}
>
	+ Add task
</button>

<div class="fixed bottom-4 right-4 z-50 flex gap-4">
	<!-- Set Duration Modal Positioned to the Left of Add Task -->
	{#if showDurationModal}
		<div
			class="absolute bottom-0 left-[-270px] max-h-[300px] w-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-lg"
		>
			<!-- Close Button for Duration Modal -->
			<button
				type="button"
				class="absolute right-2 top-2 text-gray-500"
				on:click={() => (showDurationModal = false)}
			>
				<Close className="h-5 w-5" />
			</button>

			<h2 class="text-medium mb-4 font-bold text-gray-400">Set duration</h2>

			<!-- Duration Templates -->
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
							class:bg-gray-500={newTask.taskDuration === time}
							class:bg-gray-200={newTask.taskDuration !== time}
							on:click={() => setDuration(time)}
						>
							{time}
						</button>
					{/each}
				</div>
			</div>

			<!-- Manual Duration Input -->
			<div class="mt-4">
				<h3 class="mb-4 text-xs font-bold text-gray-400">Or Enter Manually</h3>

				<!-- Manual Input Box and Colon Section -->
				<div class="flex items-center gap-2">
					<!-- Hours Input Section -->
					<div class="flex flex-col items-center">
						<input
							type="number"
							min="0"
							max="12"
							value={customDuration.split(':')[0]}
							class="w-16 rounded-md border border-gray-300 p-2 text-center font-sans text-xl font-bold"
							on:input={handleCustomHoursChange}
							id="hours"
						/>
					</div>
					<!-- Stacked Circle Separator (Colon) -->
					<div class="flex flex-col items-center justify-center gap-1">
						<span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
						<span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
					</div>
					<!-- Minutes Input Section -->
					<div class="flex flex-col items-center">
						<input
							type="number"
							min="0"
							max="59"
							value={customDuration.split(':')[1]}
							class="w-16 rounded-md border border-gray-300 p-2 text-center font-sans text-xl font-bold"
							on:input={handleCustomMinutesChange}
							id="minutes"
						/>
					</div>
				</div>

				<!-- Hours and Minutes Labels (In Their Own Section) -->
				<div class="mt-1 flex">
					<div class="flex w-16 justify-start text-xs text-gray-500">
						<span class="block text-center">Hours</span>
					</div>

					<!-- Minutes Label -->
					<div class="flex w-16 justify-start pl-6 text-xs text-gray-500">
						<span class="block text-center">Minutes</span>
					</div>
				</div>
			</div>

			<!-- Set Duration Button -->
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
	{#if showTaskModal}
		<div class="w-96 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
			<!-- Close Button (X) -->
			<div class="flex justify-end">
				<button
					type="button"
					on:click={() => (showTaskModal = false)}
					class="right-2 top-2 text-lg text-gray-500"
				>
					<Close className="h-5 w-5" />
				</button>
			</div>

			<h2 class="text-medium mb-4 font-bold text-gray-400">Add New Task</h2>

			<form class="space-y-4">
				<!-- Activity Type -->
				<div class="flex items-center justify-between">
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
					<label class="block text-sm font-medium text-gray-600">Set Priority</label>
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
				<input
					type="date"
					bind:value={newTask.taskStartDate}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>

				<!-- Set Time -->
				<label class="block text-sm font-medium text-gray-600">Start Time</label>
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
				>
					Set Duration
				</button>

				<!-- Frequency -->
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

<style>
	/* Remove arrows from input[type="number"] */
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
