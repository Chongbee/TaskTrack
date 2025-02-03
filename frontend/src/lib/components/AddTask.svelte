<script>
	// @ts-nocheck
	import { taskHandlers } from '$lib/stores/taskStore.js';
	import { userStore } from '$lib/stores/userStore.js'; // Assuming you have a user store
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { Button, Modal } from 'flowbite-svelte';

	let clickOutsideModal = false;
	let newTask = {
		title: '',
		description: '',
		completed: false,
		taskCategory: 'General',
		priority: 'Low',
		taskStartTime: '',
		taskDuration: '',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		frequency: '',
		reminders: '',
		images: []
	};

	// Local state for form validation and loading state
	let isLoading = false;
	let taskId = '';

	const user = $userStore; // Assuming you have the user data loaded in userStore

	// Handle the task form submission
	const addTask = async () => {
		isLoading = true;
		try {
			// Step 1: Create the task using the taskHandlers
			taskId = await taskHandlers.createTask(newTask);

			// Step 2: Add the task ID to the user's task list in userStore
			if (user && user.tasks) {
				user.tasks.push(taskId); // Add the new task ID to the user's task list
				userStore.update((store) => ({
					...store,
					tasks: [...store.tasks] // Update the userStore with the new list of tasks
				}));
			}

			// Step 3: Clear the form after adding the task
			newTask = {
				title: '',
				description: '',
				completed: false,
				taskCategory: 'General',
				priority: 'Low',
				taskStartTime: '',
				taskDuration: '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				frequency: '',
				reminders: '',
				images: []
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

<button
	class="rounded-3xl bg-[#7262D1] px-5 py-2 text-sm text-white"
	type="button"
	on:click={() => (clickOutsideModal = true)}>+ Add task</button
>

<Modal title="Add new task" bind:open={clickOutsideModal} autoclose outsideclose>
	<!-- Task Add Form -->
	<div class="p-4">
		<h2 class="mb-4 text-xl font-semibold">Add new Task</h2>

		<form on:submit|preventDefault={addTask}>
			<div class="mb-4">
				<label for="title" class="block text-sm font-medium">Task Title</label>
				<input
					id="title"
					type="text"
					bind:value={newTask.title}
					class="mt-1 w-full rounded border border-gray-300 p-2"
					required
				/>
			</div>

			<div class="mb-4">
				<label for="description" class="block text-sm font-medium">Task Description</label>
				<textarea
					id="description"
					bind:value={newTask.description}
					class="mt-1 w-full rounded border border-gray-300 p-2"
					required
				></textarea>
			</div>

			<div class="mb-4">
				<label for="priority" class="block text-sm font-medium">Priority</label>
				<select
					id="priority"
					bind:value={newTask.priority}
					class="mt-1 w-full rounded border border-gray-300 p-2"
				>
					<option value="Low">Low</option>
					<option value="Medium">Medium</option>
					<option value="High">High</option>
				</select>
			</div>

			<!-- Add other fields for taskCategory, frequency, etc., similarly -->
			<div class="mb-4">
				<label for="taskCategory" class="block text-sm font-medium">Category</label>
				<select
					id="taskCategory"
					bind:value={newTask.taskCategory}
					class="mt-1 w-full rounded border border-gray-300 p-2"
				>
					<option value="General">General</option>
					<option value="Work">Work</option>
					<option value="Sport">Sport</option>
					<option value="Personal">Personal</option>
					<option value="Courses">Courses</option>
				</select>
			</div>

			<!-- Additional form fields for taskStartTime, taskDuration, etc. -->

			<div class="mb-4">
				<button
					type="submit"
					class="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
					disabled={isLoading}
				>
					{isLoading ? 'Adding Task...' : 'Add Task'}
				</button>
			</div>
		</form>
	</div>
</Modal>
