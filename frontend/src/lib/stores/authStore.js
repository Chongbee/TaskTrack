//@ts-nocheck
import { writable } from 'svelte/store';
import { auth, db } from '$lib/firebase/firebase.client';
import {
	signInWithEmailAndPassword,
	updateEmail,
	updatePassword,
	signOut,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	sendEmailVerification
} from 'firebase/auth';
import { userStore } from '$lib/stores/userStore';
import { getDoc, setDoc, doc, collection, getDocs, updateDoc } from 'firebase/firestore';

export const authStore = writable({
	isLoading: true,
	currentUser: null
});

export const authHandlers = {
	login: async (email, password) => {
		try {
			authStore.update((state) => ({ ...state, isLoading: true }));

			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			return userCredential.user;
		} catch (error) {
			console.error('Login error:', error);
			authStore.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	},

	signup: async (email, password) => {
		try {
			// Clear previous data before signup
			authStore.set({ isLoading: true, currentUser: null });
			userStore.set({ currentUser: null, isLoading: true });

			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			if (user) {
				await sendEmailVerification(user);
				await authHandlers.initializeUser(user);
			}
			return user;
		} catch (error) {
			console.error('Signup error:', error);
			authStore.set({ currentUser: null, isLoading: false });
			userStore.set({ currentUser: null, isLoading: false });
			throw error;
		}
	},
	logout: async () => {
		try {
			await signOut(auth);
			// Only clear auth-related state
			authStore.set({ isLoading: false, currentUser: null });
		} catch (error) {
			console.error('Logout error:', error);
			throw error;
		}
	},

	resetPassword: async (email) => {
		await sendPasswordResetEmail(auth, email);
	},
	updateEmail: async (email) => {
		authStore.update((curr) => {
			return {
				...curr,
				currentUser: {
					...curr.currentUser,
					email: email
				}
			};
		});
		await updateEmail(auth.currentUser, email);
	},
	updatePassword: async (password) => {
		await updatePassword(auth.currentUser, password);
	},

	initializeUser: async (user) => {
		try {
			authStore.update((state) => ({ ...state, isLoading: true }));

			const userRef = doc(db, 'users', user.uid);
			const userDoc = await getDoc(userRef);

			let userData = userDoc.exists()
				? userDoc.data()
				: {
						email: user.email,
						profileImage: user.photoURL || 'https://i.imgur.com/ucsOFUO.jpeg',
						tasks: [],
						createdAt: new Date().toISOString()
					};

			if (!userDoc.exists()) {
				await setDoc(userRef, userData);
			}

			authStore.set({
				currentUser: { ...user, ...userData },
				isLoading: false
			});

			userStore.set({
				currentUser: { ...user, ...userData },
				isLoading: false
			});
		} catch (error) {
			console.error('Error initializing user:', error);
			authStore.set({ currentUser: null, isLoading: false });
			userStore.set({ currentUser: null, isLoading: false });
			throw error;
		}
	}
};
