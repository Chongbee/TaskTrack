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
		await signInWithEmailAndPassword(auth, email, password);
	},
	signup: async (email, password) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			if (user) {
				await sendEmailVerification(user);
				await authHandlers.initializeUser(user);
			}
		} catch (error) {
			console.error('Error initializing user:', error);
			userStore.update((storeData) => ({ ...storeData, currentUser: null, isLoading: false }));
		}
	},
	logout: async () => {
		await signOut(auth);
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
		if (!user) throw new Error('User is not authenticated');
		const userRef = doc(db, 'users', user.uid);
		try {
			const userDoc = await getDoc(userRef);
			let userData;

			if (userDoc.exists()) {
				userData = userDoc.data();
			} else {
				const profileImage = user.photoURL || 'https://i.imgur.com/ucsOFUO.jpeg';
				userData = {
					email: user.email,
					profileImage,
					displayName: user.displayName,
					uid: user.uid,
					phoneNumber: user.phoneNumber,
					role: 'user',
					admin: false,
					tasks: [],
					description: '',
					createdAt: new Date().toISOString()
				};
				await setDoc(userRef, userData, { merge: true });
			}

			// Merge auth user data with Firestore data
			const mergedUser = {
				...user, // Auth data
				...userData // Firestore data
			};

			// Update both stores
			authStore.set({
				currentUser: mergedUser,
				isLoading: false
			});
			userStore.set({
				currentUser: mergedUser,
				isLoading: false
			});
		} catch (error) {
			console.error('Error initializing user:', error);
			authStore.set({ currentUser: null, isLoading: false });
			userStore.set({ currentUser: null, isLoading: false });
		}
	}
};
