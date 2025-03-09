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
	let showPopup = false; // Control popup visibility
	let popupTimeout; // Handle popup auto-dismiss
	let remainingTime = 5; // Timer for popup countdown
	let interval;
	let isLoading = false; // ✅ FIX: Declare isLoading here
	export let customDuration = '00:00'; // ✅ Fix: Declare customDuration
	let selectedDuration = ''; // Holds selected template duration

	export let newTask = {
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
	const editTask = async () => {
		if (!user) {
			alert('You need to be logged in to add a task.');
			return;
		}

		try {
			const taskId = await taskHandlers.updateTask(newTask.id, {
				...newTask,
				updatedAt: new Date().toISOString() // Ensure date is included
			});

			// userHandlers.addTaskToUser(user.uid, taskId); ---------- Removing this since id doesnt change and already exists for user.

			showTaskModal = false;
			triggerPopup(taskId);
		} catch (error) {
			console.error('Error editing task:', error);
			alert('Failed to edit task.');
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
	<div class="popup-container">
		<span class="message">Task added successfully</span>
		<div class="actions">
			<!-- Circular countdown container -->
			<div class="countdown-circle-container relative flex items-center justify-center">
				<!-- Static Circle Border -->
				<div
					class="countdown-circle absolute h-full w-full rounded-full border-4 border-gray-300"
				></div>

				<!-- Animated Progress Circle -->
				<div
					class="countdown-progress absolute h-full w-full rounded-full border-4 border-[#7262D1]"
					style="background: conic-gradient(#7262D1 0% {remainingTime *
						20}%, #e0e0e0 {remainingTime * 20}% 100%);"
				></div>

				<!-- Timer Text (no "s") -->
				<span class="timer absolute text-lg font-bold">{remainingTime}</span>
			</div>
			<button
				class="w-auto rounded-full bg-[#7262D1] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#5b4bcf]"
				on:click={undoTaskAddition}>Undo</button
			>
			<button class="close-btn" on:click={() => (showPopup = false)}>
				<Close class="h-5 w-5" />
			</button>
		</div>
	</div>
{/if}

<!-- Add Task Button -->
<button
	class="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
	on:click={() => (showTaskModal = true)}
>
	Edit
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
							class:bg-gray-500={selectedDuration === time}
							class:bg-gray-200={selectedDuration !== time}
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
					on:click={editTask}
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
	.popup-container {
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		background: white;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 1rem;
		animation: fadeIn 0.3s ease-out;
	}

	.countdown-circle-container {
		position: relative;
		width: 50px;
		height: 50px;
	}

	.countdown-circle {
		border-color: #dcdcdc;
		border-radius: 50%;
	}

	.countdown-progress {
		background: conic-gradient(#7262d1 0% 0%, #e0e0e0 0% 100%);
		transition: background 1s linear; /* Smooth transition for the countdown animation */
	}

	.message {
		font-size: 1rem;
		color: black;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.timer {
		font-size: 1rem;
		font-weight: bold;
		color: gray;
		position: absolute;
	}

	.undo-btn {
		background: #7262d1;
		color: white;
		border: none;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s ease-in-out;
	}

	.undo-btn:hover {
		background: #5b4bcf;
	}

	.close-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		color: gray;
	}

	.close-btn:hover {
		color: black;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
