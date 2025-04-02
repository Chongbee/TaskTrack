<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { notificationStore, notificationHandlers } from '$lib/stores/notificationStore';
	import { authStore } from '$lib/stores/authStore';
	import Header from '$lib/components/Header.svelte';

	let notifications = [];
	let isLoading = true;
	let currentUserId = null;
	let showArchived = false;

	// Fetch notifications when the page loads
	onMount(() => {
		authStore.subscribe((auth) => {
			if (auth.currentUser) {
				currentUserId = auth.currentUser.uid;
				loadNotifications();
			}
		});
	});

	async function loadNotifications() {
		await notificationHandlers.getNotifications(currentUserId, showArchived);
		notificationStore.subscribe((state) => {
			notifications = state.notifications;
			isLoading = state.isLoading;
		});
	}

	async function markAllAsRead() {
		if (currentUserId) {
			await notificationHandlers.archiveAllNotifications(currentUserId);
			await loadNotifications();
		}
	}

	async function toggleArchivedView() {
		showArchived = !showArchived;
		await loadNotifications();
	}

	async function markAsViewed(notificationId) {
		await notificationHandlers.markAsViewed(notificationId);
		await loadNotifications();
	}

	async function clearAllNotifications() {
		if (currentUserId) {
			const confirmed = confirm('Are you sure you want to permanently delete all notifications?');
			if (confirmed) {
				await notificationHandlers.clearAllNotifications(currentUserId);
				await loadNotifications();
			}
		}
	}

	const date = new Date();
	const formattedDate = `${date.toLocaleString('en-US', { weekday: 'long' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;
</script>

<div class="flex w-full min-w-[200px] flex-wrap items-center justify-between gap-2">
	<div class="text-md whitespace-nowrap font-bold text-black">
		{showArchived ? 'Archived Notifications' : 'Inbox'}
	</div>
	<div class="flex items-center gap-3 whitespace-nowrap">
		<div class="text-sm font-bold text-gray-500">{formattedDate}</div>
	</div>
</div>

<!-- Action Buttons - Always Visible -->
<div class="mb-4 flex gap-2">
	{#if !showArchived}
		<button
			on:click={markAllAsRead}
			class="rounded-md bg-[#5042A5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a2d7a]"
		>
			Mark All as Read
		</button>
	{/if}
	<button
		on:click={toggleArchivedView}
		class="rounded-md bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
	>
		{showArchived ? 'Show Active' : 'Show Archived'}
	</button>
	{#if showArchived}
		<button
			on:click={clearAllNotifications}
			class="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
		>
			Clear All
		</button>
	{/if}
</div>

{#if isLoading}
	<p class="text-gray-500">Loading notifications...</p>
{:else if notifications.length === 0}
	<p class="text-gray-500">
		{showArchived ? 'No archived notifications' : 'No unread notifications'}
	</p>
{:else}
	<div class="space-y-3">
		{#each notifications as notification (notification.id)}
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
					{#if !notification.viewed && !showArchived}
						<span class="h-3 w-3 rounded-full bg-[#5042A5]"></span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
