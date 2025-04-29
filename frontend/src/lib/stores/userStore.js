// @ts-nocheck
import { writable } from 'svelte/store';
import { db } from '$lib/firebase/firebase.client';
import { addDoc, deleteDoc, updateDoc, getDoc, getDocs, collection, doc } from 'firebase/firestore';

export const userStore = writable({
	users: [],
	currentUser: null,
	isLoading: false
});

export const userHandlers = {
	getUsers: async () => {
		try {
			userStore.update((state) => ({ ...state, isLoading: true }));
			const usersRef = collection(db, 'users');
			const snapshot = await getDocs(usersRef);
			const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
			userStore.set({ users, currentUser: null, isLoading: false });
		} catch (error) {
			console.error('Error fetching users:', error);
			userStore.update((state) => ({ ...state, isLoading: false }));
		}
	},

	getUser: async (userId) => {
		if (!userId) {
			console.error('getUser called without userId');
			return;
		}

		try {
			userStore.update((state) => ({ ...state, isLoading: true }));
			const userRef = doc(db, 'users', userId);
			const userDoc = await getDoc(userRef);

			if (userDoc.exists()) {
				const userData = userDoc.data();
				userStore.update((state) => ({
					...state,
					currentUser: { id: userDoc.id, ...userData },
					isLoading: false
				}));
			} else {
				userStore.update((state) => ({
					...state,
					currentUser: null,
					isLoading: false
				}));
			}
		} catch (error) {
			console.error('Error fetching user:', error);
			userStore.update((state) => ({ ...state, isLoading: false }));
		}
	},

	addTaskToUser: async (userId, newTaskId) => {
		if (!userId || !newTaskId) {
			console.error('Invalid parameters for addTaskToUser');
			throw new Error('userId and newTaskId are required');
		}

		try {
			const userRef = doc(db, 'users', userId);
			const userDoc = await getDoc(userRef);

			if (!userDoc.exists()) {
				throw new Error('User not found');
			}

			const userData = userDoc.data();
			const currentTasks = userData.tasks || [];

			// Check if task already exists to prevent duplicates
			if (currentTasks.includes(newTaskId)) {
				return currentTasks;
			}

			const updatedTasks = [...currentTasks, newTaskId];

			// Update Firestore
			await updateDoc(userRef, { tasks: updatedTasks });

			// Update store immutably
			userStore.update((state) => {
				if (state.currentUser && state.currentUser.id === userId) {
					return {
						...state,
						currentUser: {
							...state.currentUser,
							tasks: updatedTasks
						}
					};
				}
				return state;
			});

			return updatedTasks;
		} catch (error) {
			console.error('Error adding task to user:', error);
			throw error;
		}
	},

	createUser: async (userData) => {
		try {
			if (!userData) throw new Error('User data is required');

			const usersRef = collection(db, 'users');
			const newUserRef = await addDoc(usersRef, {
				...userData,
				tasks: [], // Initialize with empty tasks array
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			return newUserRef.id;
		} catch (error) {
			console.error('Error creating user:', error);
			throw error;
		}
	},

	updateUser: async (userId, userData) => {
		if (!userId || !userData) {
			throw new Error('userId and userData are required');
		}

		try {
			const userRef = doc(db, 'users', userId);
			await updateDoc(userRef, {
				...userData,
				updatedAt: new Date().toISOString()
			});

			// Update store if we're updating the current user
			userStore.update((state) => {
				if (state.currentUser && state.currentUser.id === userId) {
					return {
						...state,
						currentUser: {
							...state.currentUser,
							...userData,
							updatedAt: new Date().toISOString()
						}
					};
				}
				return state;
			});
		} catch (error) {
			console.error('Error updating user:', error);
			throw error;
		}
	},

	deleteUser: async (userId) => {
		if (!userId) {
			throw new Error('userId is required');
		}

		try {
			const userRef = doc(db, 'users', userId);
			await deleteDoc(userRef);

			// Update store if we're deleting the current user
			userStore.update((state) => {
				if (state.currentUser && state.currentUser.id === userId) {
					return { ...state, currentUser: null };
				}
				return state;
			});
		} catch (error) {
			console.error('Error deleting user:', error);
			throw error;
		}
	}
};
