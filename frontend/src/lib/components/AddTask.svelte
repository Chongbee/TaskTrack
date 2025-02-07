<script>
	// @ts-nocheck
	import { taskHandlers } from '$lib/stores/taskStore.js';
	import { userHandlers, userStore } from '$lib/stores/userStore.js';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { Button, Modal } from 'flowbite-svelte';
	import { authStore } from '$lib/stores/authStore';

	let clickOutsideModal = false;
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

	let isLoading = false;
	let taskId = '';

	let user = null;
	userStore.subscribe((curr) => {
		user = curr?.currentUser;
	});

	const addTask = async () => {
		console.log('hello world');
		if (!user) {
			alert('You need to be logged in to add a task.');
			return;
		}

		isLoading = true;

		try {
			// Create the task and get the new task ID
			const taskId = await taskHandlers.createTask(user.uid, newTask);
			console.log(taskId, newTask);
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
	on:click={() => (clickOutsideModal = true)}
>
	+ Add task
</button>

<Modal title="Add new task" bind:open={clickOutsideModal} autoclose outsideclose>
	<div class="mx-auto w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-bold text-gray-900">Add New Task</h2>

		<form class="space-y-4">
			<!-- Activity Type -->
			<div>
				<label for="activity-type" class="block text-sm font-medium text-gray-600"
					>Choose activity type</label
				>
				<select
					bind:value={newTask.taskCategory}
					class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				>
					<option value="Home">🏠 Home</option>
					<option value="Work">💼 Work</option>
					<option value="Sport">🏋️‍♂️ Sport</option>
					<option value="Personal">👤 Personal</option>
					<option value="Courses">📚 Courses</option>
				</select>
			</div>

			<!-- Task Title -->
			<div>
				<input
					type="text"
					placeholder="Task title"
					bind:value={newTask.title}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
					required
				/>
			</div>

			<!-- Task Description -->
			<div>
				<textarea
					placeholder="Task description"
					bind:value={newTask.description}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
					required
				></textarea>
			</div>

			<!-- Priority -->
			<div>
				<label for="priority" class="block text-sm font-medium text-gray-600">Set Priority</label>
				<div class="flex gap-2">
					<button
						type="button"
						class="rounded-full px-4 py-2 text-sm font-medium"
						class:selected={newTask.priority === 'High'}
						on:click={() => (newTask.priority = 'High')}
					>
						High
					</button>
					<button
						type="button"
						class="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
						class:selected={newTask.priority === 'Medium'}
						on:click={() => (newTask.priority = 'Medium')}
					>
						Med
					</button>
					<button
						type="button"
						class="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
						class:selected={newTask.priority === 'Low'}
						on:click={() => (newTask.priority = 'Low')}
					>
						Low
					</button>
				</div>
			</div>

			<!-- Set Date -->
			<div>
				<label for="date" class="block text-sm font-medium text-gray-600">📅 Set date</label>
				<input
					type="date"
					bind:value={newTask.taskStartDate}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>
			</div>

			<!-- Set Time -->
			<div>
				<label for="time" class="block text-sm font-medium text-gray-600">🕐 Set time</label>
				<input
					type="time"
					bind:value={newTask.taskStartTime}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>
			</div>

			<!-- Duration -->
			<div>
				<label for="duration" class="block text-sm font-medium text-gray-600">⏳ Set duration</label
				>
				<input
					type="text"
					bind:value={newTask.taskDuration}
					placeholder="1 h"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				/>
			</div>

			<!-- Frequency -->
			<div>
				<label for="frequency" class="block text-sm font-medium text-gray-600">🌔 Frequency</label>
				<select
					bind:value={newTask.frequency}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				>
					<option value="None">None</option>
					<option value="Daily">Daily</option>
					<option value="Weekly">Weekly</option>
					<option value="Bi-weekly">Bi-weekly</option>
				</select>
			</div>

			<!-- Reminders -->
			<div>
				<label for="reminders" class="block text-sm font-medium text-gray-600">⏰ Reminders</label>
				<select
					bind:value={newTask.reminders}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
				>
					<option value="Before 10 min">Before 10 min</option>
					<option value="Before 30 min">Before 30 min</option>
					<option value="Before 60 min">Before 60 min</option>
				</select>
			</div>

			<!-- Add Task Button -->
			<div class="mt-4 flex justify-center">
				<button
					on:click={addTask}
					type="button"
					class="w-full rounded-2xl bg-[#7262D1] py-3 font-semibold text-white transition hover:bg-[#5b4bcf]"
					disabled={isLoading}
				>
					{isLoading ? 'Adding Task...' : 'Add task'}
				</button>
			</div>
		</form>
	</div>
</Modal>
