// @ts-nocheck
import { writable } from 'svelte/store';
import { db } from '$lib/firebase/firebase.client';
import { addDoc, deleteDoc, updateDoc, getDoc, getDocs, collection, doc } from 'firebase/firestore';
// import { authStore } from './authStore';

export const userStore = writable({
	users: [],
	currentUser: null,
	isloading: false
});

// CRUD operations for users
export const userHandlers = {
	getUsers: async () => {
		const usersRef = collection(db, 'users');
		const snapshot = await getDocs(usersRef);
		const users = [];
		snapshot.forEach((doc) => {
			users.push({ id: doc.id, ...doc.data() });
		});
		userStore.set({ isLoading: false, users });
	},

	getUser: async (userId) => {
		const userRef = doc(db, 'users', userId);
		const userDoc = await getDoc(userRef);
		if (userDoc.exists()) {
			const userData = userDoc.data();
			userStore.set({ isLoading: false, currentUser: { id: userDoc.id, ...userData } });
		} else {
			userStore.set({ isLoading: false, currentUser: null });
		}
	},

	addTaskToUser: async (userId, newTaskId) => {
		if (!userId) {
			console.error('addTaskToUser called without a valid userId.');
			throw new Error('Invalid userId.');
		}
		try {
			const userRef = doc(db, 'users', userId);
			const userDoc = await getDoc(userRef);
			if (userDoc.exists()) {
				const userData = userDoc.data();
				const updatedTasks = [...(userData.tasks || []), newTaskId];
				await updateDoc(userRef, { tasks: updatedTasks });

				// Update the userStore with the updated tasks
				userStore.update((state) => {
					if (state.currentUser && state.currentUser.id === userId) {
						state.currentUser.tasks = updatedTasks;
					}
					return state;
				});

				return updatedTasks;
			} else {
				console.warn(`User with ID ${userId} not found.`);
				throw new Error('User not found.');
			}
		} catch (error) {
			console.error('Error adding task to user:', error);
			throw error;
		}
	},

	createUser: async (userData) => {
		const usersRef = collection(db, 'users');
		const newUserRef = await addDoc(usersRef, userData);
		return newUserRef.id;
	},

	updateUser: async (userId, userData) => {
		const userRef = doc(db, 'users', userId);
		await updateDoc(userRef, userData);
	},

	deleteUser: async (userId) => {
		const userRef = doc(db, 'users', userId);
		await deleteDoc(userRef);
	}
};
