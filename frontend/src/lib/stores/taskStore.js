// @ts-nocheck
import { writable } from 'svelte/store';
import { db } from '$lib/firebase/firebase.client';
import { addDoc, deleteDoc, updateDoc, getDoc, getDocs, collection, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { notificationHandlers } from '$lib/stores/notificationStore';
// Task store state
export const taskStore = writable({
	isLoading: true,
	tasks: [],
	currentTask: null
});

// Handlers for task-related operations
export const taskHandlers = {
	// Fetch all tasks
	getTasks: async () => {
		try {
			const tasksRef = collection(db, 'tasks');
			const snapshot = await getDocs(tasksRef);
			const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

			// Sort tasks by taskStartDate
			const sortedTasks = tasks.sort((a, b) => {
				return new Date(a.taskStartDate) - new Date(b.taskStartDate);
			});

			taskStore.set({ isLoading: false, tasks: sortedTasks });
		} catch (error) {
			console.error('Error fetching tasks:', error);
		}
	},

	// Fetch a single task by ID
	getTask: async (taskId) => {
		try {
			const taskRef = doc(db, 'tasks', taskId);
			const taskDoc = await getDoc(taskRef);
			if (taskDoc.exists()) {
				taskStore.update((state) => ({
					...state,
					isLoading: false,
					currentTask: { id: taskDoc.id, ...taskDoc.data() }
				}));
			} else {
				console.warn(`Task with ID ${taskId} does not exist.`);
				taskStore.update((state) => ({
					...state,
					isLoading: false,
					currentTask: null
				}));
			}
		} catch (error) {
			console.error('Error fetching task:', error);
		}
	},

	getMyTasks: async (taskIds) => {
		try {
			// Clear existing tasks immediately
			taskStore.update((state) => ({
				...state,
				isLoading: true,
				tasks: []
			}));

			if (!Array.isArray(taskIds) || taskIds.length === 0) {
				console.warn('No task IDs provided or invalid format');
				taskStore.update((state) => ({
					...state,
					isLoading: false,
					tasks: []
				}));
				return;
			}

			const taskPromises = taskIds.map(async (taskId) => {
				const taskRef = doc(db, `tasks`, taskId);
				const taskDoc = await getDoc(taskRef);
				return taskDoc.exists() ? { id: taskDoc.id, ...taskDoc.data() } : null;
			});

			const tasks = (await Promise.all(taskPromises)).filter((task) => task !== null);

			// Sort tasks by taskStartDate
			const sortedTasks = tasks.sort((a, b) => {
				return new Date(a.taskStartDate) - new Date(b.taskStartDate);
			});

			taskStore.update((state) => ({
				...state,
				isLoading: false,
				tasks: sortedTasks
			}));
		} catch (error) {
			console.error('Error fetching tasks:', error);
			taskStore.update((state) => ({
				...state,
				isLoading: false,
				tasks: []
			}));
		}
	},

	// Add a new task
	createTask: async (userId, taskData) => {
		try {
			if (!userId) {
				throw new Error('User ID is missing');
			}

			// Reference to the tasks collection in Firestore
			const tasksRef = collection(db, `tasks`);
			console.log(`Saving task for user: ${userId}`, taskData);

			// Add the task to Firestore
			const newTaskRef = await addDoc(tasksRef, {
				...taskData,
				imageUrls: [] // Initialize with an empty imageUrls array
			});

			// Get today's date in YYYY-MM-DD format
			const today = new Date().toISOString().split('T')[0];

			// Get the task's start date in YYYY-MM-DD format
			const taskDate = new Date(taskData.taskStartDate).toISOString().split('T')[0];

			// Check if the task's start date is today
			if (taskDate === today) {
				// If the task is due today, create a notification
				await notificationHandlers.createNotification(userId, {
					message: `Task "${taskData.title}" is due today.`,
					taskId: newTaskRef.id // Optional: Link the notification to the task
				});
			}

			// Fetch the updated list of tasks for the user
			await taskHandlers.getTasks(userId);

			// Return the ID of the newly created task
			return newTaskRef.id;
		} catch (error) {
			console.error('Error creating task:', error);
			throw error;
		}
	},

	// Upload task images and update the task with URLs
	uploadImages: async (taskId, imageFiles) => {
		try {
			const storage = getStorage();
			const imageUrls = await Promise.all(
				imageFiles.map(async (file) => {
					const storageRef = ref(storage, `task_images/${taskId}/${file.name}`);
					await uploadBytes(storageRef, file);
					return getDownloadURL(storageRef);
				})
			);

			const taskRef = doc(db, 'tasks', taskId);
			await updateDoc(taskRef, { imageUrls });
			return imageUrls;
		} catch (error) {
			console.error('Error uploading images:', error);
			throw error;
		}
	},

	// Update an existing task
	updateTask: async (taskId, taskData) => {
		try {
			const taskRef = doc(db, 'tasks', taskId);
			await updateDoc(taskRef, taskData);

			// Update the store directly
			taskStore.update((state) => {
				const updatedTasks = state.tasks.map((task) =>
					task.id === taskId ? { ...task, ...taskData } : task
				);

				return { ...state, tasks: updatedTasks };
			});

			return taskId;
		} catch (error) {
			console.error('Error updating task:', error);
			throw error;
		}
	},

	// Delete a task
	deleteTask: async (taskId) => {
		const confirmation = window.confirm('Are you sure you want to delete this task?');
		if (confirmation) {
			try {
				const taskRef = doc(db, 'tasks', taskId);
				await deleteDoc(taskRef);
				alert('Task successfully deleted.');
			} catch (error) {
				console.error('Error deleting task:', error);
			}
		}
	},

	// Fetch a task image URL
	fetchImageUrl: async (taskId) => {
		try {
			const storage = getStorage();
			const storageRef = ref(storage, `task_images/${taskId}`);
			return await getDownloadURL(storageRef);
		} catch (error) {
			console.error('Error fetching image URL:', error);
			throw error;
		}
	}
};
