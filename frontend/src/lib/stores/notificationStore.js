// @ts-nocheck
import { writable } from 'svelte/store';
import { db } from '$lib/firebase/firebase.client';
import {
	addDoc,
	updateDoc,
	deleteDoc,
	getDocs,
	collection,
	doc,
	query,
	where,
	writeBatch
} from 'firebase/firestore';

export const notificationStore = writable({
	isLoading: true,
	activeNotifications: [],
	archivedNotifications: [],
	showArchived: false // New state to toggle archived view
});

export const notificationHandlers = {
	getNotifications: async (userId) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			const q = query(notificationsRef, where('userId', '==', userId));
			const snapshot = await getDocs(q);

			const allNotifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

			// Split into active and archived
			const active = allNotifications.filter((n) => !n.archived);
			const archived = allNotifications.filter((n) => n.archived);

			notificationStore.update((state) => ({
				...state,
				isLoading: false,
				activeNotifications: active,
				archivedNotifications: archived
			}));
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	},

	createNotification: async (userId, notificationData) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			const docRef = await addDoc(notificationsRef, {
				...notificationData,
				userId,
				viewed: false,
				archived: false, // New notifications are never archived by default
				timestamp: new Date().toISOString()
			});
			return docRef.id;
		} catch (error) {
			console.error('Error creating notification:', error);
			throw error;
		}
	},

	// Modified to archive when marking as viewed
	markAsViewed: async (notificationId, userId) => {
		// Add userId parameter
		try {
			const notificationRef = doc(db, 'notifications', notificationId);
			await updateDoc(notificationRef, {
				viewed: true,
				archived: true
			});

			// Force a refresh of all notifications
			await notificationHandlers.getNotifications(userId);
		} catch (error) {
			console.error('Error marking notification as viewed:', error);
			throw error;
		}
	},

	// New: Archive all notifications
	// In your notificationHandlers.js
	// In your notificationHandlers.js
	archiveAllNotifications: async (userId) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			const q = query(
				notificationsRef,
				where('userId', '==', userId),
				where('archived', '==', false)
			);
			const snapshot = await getDocs(q);

			const batch = writeBatch(db);
			snapshot.docs.forEach((doc) => {
				batch.update(doc.ref, {
					archived: true,
					viewed: true
				});
			});
			await batch.commit();

			// Immediately update store state
			notificationStore.update((state) => {
				const notification = state.activeNotifications.find((n) => n.id === notificationId);
				if (!notification) return state;

				return {
					...state,
					activeNotifications: state.activeNotifications.filter((n) => n.id !== notificationId),
					archivedNotifications: [
						...state.archivedNotifications,
						{
							...notification,
							viewed: true,
							archived: true
						}
					]
				};
			});
		} catch (error) {
			console.error('Error marking notification as viewed:', error);
			throw error;
		}
	},

	// Clear all notifications for the current user
	clearAllNotifications: async (userId) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			const q = query(
				notificationsRef,
				where('userId', '==', userId),
				where('archived', '==', true)
			);
			const snapshot = await getDocs(q);

			const batch = writeBatch(db);
			snapshot.docs.forEach((doc) => {
				batch.delete(doc.ref);
			});
			await batch.commit();

			// Immediately update store state
			notificationStore.update((state) => ({
				...state,
				archivedNotifications: []
			}));
		} catch (error) {
			console.error('Error clearing notifications:', error);
			throw error;
		}
	}
};
