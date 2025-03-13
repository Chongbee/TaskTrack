<script>
	import Clock from '$lib/icons/Clock.svelte';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';

	// Mock data for messages
	let messages = [
		{
			id: 1,
			sender: 'John Doe',
			subject: 'Project Update',
			body: 'Here’s the latest update on the project...',
			time: '2h ago',
			unread: true
		},
		{
			id: 2,
			sender: 'Jane Smith',
			subject: 'Meeting Reminder',
			body: 'Don’t forget the meeting at 3 PM today...',
			time: '4h ago',
			unread: false
		},
		{
			id: 3,
			sender: 'Team Alerts',
			subject: 'New Task Assigned',
			body: 'You have been assigned a new task: "Fix Bugs"...',
			time: '1d ago',
			unread: true
		}
	];

	// Mock data for notifications
	let notifications = [
		{ id: 1, text: 'You completed "Design Dashboard"', time: '2h ago' },
		{ id: 2, text: 'New comment on "Write Report"', time: '4h ago' },
		{ id: 3, text: 'Task "Fix Bugs" is due tomorrow', time: '1d ago' }
	];

	// Function to mark a message as read
	function markAsRead(messageId) {
		messages = messages.map((msg) => (msg.id === messageId ? { ...msg, unread: false } : msg));
	}
</script>

<div class="p-6">
	<!-- Page Header -->
	<div class="flex w-full items-center justify-between">
		<div class="text-xl font-bold text-black">Inbox</div>
		<div class="flex items-center gap-3">
			<div class="text-sm font-bold text-gray-500">
				You have {messages.filter((msg) => msg.unread).length} unread messages
			</div>
		</div>
	</div>

	<!-- Messages Section -->
	<div class="mt-6 rounded-md bg-white p-4 shadow">
		<div class="text-lg font-bold text-black">Messages</div>
		<div class="mt-4 space-y-2">
			{#each messages as message}
				<div
					class="flex cursor-pointer items-center justify-between rounded-md p-3 {message.unread
						? 'bg-[#F5F6FD]'
						: 'bg-white'}"
					on:click={() => markAsRead(message.id)}
				>
					<div class="flex flex-col gap-1">
						<div class="text-lg font-semibold text-black">{message.sender}</div>
						<div class="text-sm text-gray-500">{message.subject}</div>
						<div class="text-sm text-gray-400">{message.body}</div>
					</div>
					<div class="flex items-center gap-2">
						<div class="text-sm text-gray-500">{message.time}</div>
						{#if message.unread}
							<div class="h-2 w-2 rounded-full bg-[#5042A5]"></div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Notifications Section -->
	<div class="mt-6 rounded-md bg-white p-4 shadow">
		<div class="text-lg font-bold text-black">Notifications</div>
		<div class="mt-4 space-y-2">
			{#each notifications as notification}
				<div class="flex items-center justify-between rounded-md bg-[#F5F6FD] p-3">
					<div class="text-sm text-gray-500">{notification.text}</div>
					<div class="text-sm text-gray-500">{notification.time}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="flex items-center gap-4 rounded-md bg-white p-4 shadow">
			<div class="text-2xl">📩</div>
			<div>
				<div class="text-lg font-bold text-black">New Message</div>
				<div class="text-sm text-gray-500">Compose a new message</div>
			</div>
		</div>
		<div class="flex items-center gap-4 rounded-md bg-white p-4 shadow">
			<div class="text-2xl">🔔</div>
			<div>
				<div class="text-lg font-bold text-black">Notifications</div>
				<div class="text-sm text-gray-500">View all notifications</div>
			</div>
		</div>
		<div class="flex items-center gap-4 rounded-md bg-white p-4 shadow">
			<div class="text-2xl">🗑️</div>
			<div>
				<div class="text-lg font-bold text-black">Clear All</div>
				<div class="text-sm text-gray-500">Delete all messages</div>
			</div>
		</div>
	</div>
</div>

<style>
	.grid {
		display: grid;
	}
</style>
