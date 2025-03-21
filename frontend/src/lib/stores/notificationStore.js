// @ts-nocheck
import { writable } from 'svelte/store';
import { db } from '$lib/firebase/firebase.client';
import { addDoc, updateDoc, getDocs, collection, doc, query, where } from 'firebase/firestore';

// Notification store state
export const notificationStore = writable({
	isLoading: true,
	notifications: []
});

// Handlers for notification-related operations
export const notificationHandlers = {
	// Create a new notification
	createNotification: async (userId, notificationData) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			const newNotification = {
				...notificationData,
				userId,
				viewed: false,
				timestamp: new Date().toISOString()
			};
			const docRef = await addDoc(notificationsRef, newNotification);

			// Fetch the updated list of notifications
			await notificationHandlers.getNotifications(userId);
		} catch (error) {
			console.error('Error creating notification:', error);
			throw error;
		}
	},

	// Fetch notifications for a specific user
	getNotifications: async (userId) => {
		try {
			const notificationsRef = collection(db, 'notifications');
			const q = query(notificationsRef, where('userId', '==', userId));
			const snapshot = await getDocs(q);
			const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

			// Sort notifications by timestamp (newest first)
			const sortedNotifications = notifications.sort((a, b) => {
				return new Date(b.timestamp) - new Date(a.timestamp);
			});

			notificationStore.set({ isLoading: false, notifications: sortedNotifications });
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	},

	// Mark a notification as viewed
	markAsViewed: async (notificationId) => {
		try {
			const notificationRef = doc(db, 'notifications', notificationId);
			await updateDoc(notificationRef, { viewed: true });

			// Update the store to reflect the change
			notificationStore.update((state) => {
				const updatedNotifications = state.notifications.map((notification) =>
					notification.id === notificationId ? { ...notification, viewed: true } : notification
				);
				return { ...state, notifications: updatedNotifications };
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
