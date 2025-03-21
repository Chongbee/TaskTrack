<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { notificationStore, notificationHandlers } from '$lib/stores/notificationStore';
	import { authStore } from '$lib/stores/authStore';
	import Header from '$lib/components/Header.svelte';

	let notifications = [];
	let isLoading = true;
	let currentUserId = null;

	// Fetch notifications when the page loads
	onMount(() => {
		authStore.subscribe((auth) => {
			if (auth.currentUser) {
				currentUserId = auth.currentUser.uid; // Store the current user ID
				notificationHandlers.getNotifications(currentUserId).then(() => {
					notificationStore.subscribe((state) => {
						notifications = state.notifications;
						isLoading = state.isLoading;
					});
				});
			}
		});
	});

	// Function to mark a notification as viewed
	async function markAsViewed(notificationId) {
		await notificationHandlers.markAsViewed(notificationId);
	}

	// Function to clear all notifications
	async function clearAllNotifications() {
		if (currentUserId) {
			const confirmed = confirm('Are you sure you want to clear all notifications?');
			if (confirmed) {
				await notificationHandlers.clearAllNotifications(currentUserId);
			}
		}
	}
	const date = new Date();
	const formattedDate = `${date.toLocaleString('en-US', { weekday: 'long' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;
</script>

<div class="flex w-full min-w-[200px] flex-wrap items-center justify-between gap-2">
	<div class="text-md whitespace-nowrap font-bold text-black">Inbox</div>
	<div class="flex items-center gap-3 whitespace-nowrap">
		<div class="text-sm font-bold text-gray-500">{formattedDate}</div>
	</div>
</div>

{#if isLoading}
	<p class="text-gray-500">Loading notifications...</p>
{:else if notifications.length === 0}
	<p class="text-gray-500">No notifications available.</p>
{:else}
	<div class="space-y-3">
		<!-- Clear All Notifications Button -->

		<!-- Notifications List -->
		{#each notifications as notification (notification.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				on:click={() => markAsViewed(notification.id)}
				class="cursor-pointer rounded-md p-3 shadow-sm {notification.viewed
					? 'bg-gray-100'
					: 'bg-white'} transition-colors duration-200 hover:bg-gray-50"
			>
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-semibold text-gray-800">{notification.message}</h3>
						<p class="text-xs text-gray-600">
							Time: {new Date(notification.timestamp).toLocaleString()}
						</p>
					</div>
					{#if !notification.viewed}
						<span class="h-3 w-3 rounded-full bg-[#5042A5]"></span>
					{/if}
				</div>
			</div>
		{/each}
		<button
			on:click={clearAllNotifications}
			class="mb-4 w-full rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
		>
			Clear All Notifications
		</button>
	</div>
{/if}
