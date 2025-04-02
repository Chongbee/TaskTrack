// @ts-nocheck
import { writable } from 'svelte/store';
import { db } from '$lib/firebase/firebase.client';
import { addDoc, updateDoc, getDocs, collection, doc, query, where } from 'firebase/firestore';

export const notificationStore = writable({
	isLoading: true,
	notifications: [],
	showArchived: false // New state to toggle archived view
});

export const notificationHandlers = {
	// ... keep createNotification the same ...

	// Modified to handle archived filtering
	getNotifications: async (userId, showArchived = false) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			let q = query(notificationsRef, where('userId', '==', userId));

			const snapshot = await getDocs(q);
			let notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

			// Filter based on archived status unless showing all
			if (!showArchived) {
				notifications = notifications.filter((n) => !n.archived);
			}

			// Sort by timestamp (newest first)
			notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

			notificationStore.update((state) => ({
				...state,
				isLoading: false,
				notifications,
				showArchived
			}));
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	},

	// Modified to archive when marking as viewed
	markAsViewed: async (notificationId) => {
		try {
			const notificationRef = doc(db, 'notifications', notificationId);
			await updateDoc(notificationRef, {
				viewed: true,
				archived: true // Archive when viewed
			});

			notificationStore.update((state) => {
				const updatedNotifications = state.notifications.filter((n) => n.id !== notificationId); // Remove from list since it's archived
				return { ...state, notifications: updatedNotifications };
			});
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

			// Update each notification to be archived and viewed
			const batchUpdates = snapshot.docs.map((doc) =>
				updateDoc(doc.ref, {
					archived: true,
					viewed: true
				})
			);
			await Promise.all(batchUpdates);

			// Refresh the notifications list
			await notificationHandlers.getNotifications(userId, false);
		} catch (error) {
			console.error('Error archiving notifications:', error);
			throw error;
		}
	},

	// Clear all notifications for the current user
	clearAllNotifications: async (userId) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			const q = query(notificationsRef, where('userId', '==', userId));
			const snapshot = await getDocs(q);

			// Delete each notification
			snapshot.docs.forEach(async (doc) => {
				await deleteDoc(doc.ref);
			});

			// Update the store to reflect the change
			notificationStore.set({ isLoading: false, notifications: [] });
		} catch (error) {
			console.error('Error clearing notifications:', error);
			throw error;
		}
	}
};
