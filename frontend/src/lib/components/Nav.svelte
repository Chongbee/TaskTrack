<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, authHandlers } from '$lib/stores/authStore';
	import { notificationStore, notificationHandlers } from '$lib/stores/notificationStore';
	import Arrow from '$lib/icons/Arrow.svelte';
	import Barchart from '$lib/icons/Barchart.svelte';
	import Dashboard from '$lib/icons/Dashboard.svelte';
	import Inbox from '$lib/icons/Inbox.svelte';
	import Calender from '$lib/icons/Calender.svelte';
	import Home from '$lib/icons/Home.svelte';
	import Work from '$lib/icons/Work.svelte';
	import Sport from '$lib/icons/Sport.svelte';
	import Personal from '$lib/icons/Personal.svelte';
	import Courses from '$lib/icons/Courses.svelte';
	import Settings from '$lib/icons/Settings.svelte';
	import Help from '$lib/icons/Help.svelte';
	import Notification from '$lib/icons/Notification.svelte';
	import { clickOutside } from '$lib/utils/clickOutside';
	import { userStore } from '$lib/stores/userStore';

	let dropdownRef;
	let isDropdownOpen = false; // Control dropdown visibility
	let notificationCount = 0; // Store the number of notifications

	// Fetch user data and notifications on mount
	// Reactive declarations for immediate updates
	$: displayName =
		$userStore.currentUser?.displayName || $authStore.currentUser?.displayName || 'Username';
	$: profileImage =
		$userStore.currentUser?.profileImage ||
		$authStore.currentUser?.photoURL ||
		'https://i.imgur.com/ucsOFUO.jpeg';
	onMount(() => {
		// Single auth store subscription
		const authUnsubscribe = authStore.subscribe((auth) => {
			if (auth.currentUser) {
				notificationHandlers.getNotifications(auth.currentUser.uid);
			}
		});

		// Notification store subscription
		const notificationUnsubscribe = notificationStore.subscribe((state) => {
			notificationCount = state.notifications.filter((n) => !n.viewed).length;
		});

		// Cleanup both subscriptions on unmount
		return () => {
			authUnsubscribe();
			notificationUnsubscribe();
		};
	});

	// Logout function
	const logout = () => {
		authHandlers.logout().then(() => {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('searchStore');
				localStorage.removeItem('selectedServices');
			}
			goto('/signIn'); // Redirect after cleanup
		});
	};

	// Toggle dropdown visibility
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}
</script>

<div class="flex h-screen w-[300px] flex-col justify-between bg-[#181625] p-5 text-gray-400">
	<!-- Top Section -->
	<div class="space-y-8">
		<!-- Logo, Search, and Icon -->
		<div>
			<!-- Logo and Icon -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-1">
					<img src="tttlogo.png" alt="TaskTrack Logo" class="h-8 w-8" />
					<span class="text-lg font-semibold text-white">TaskTrack</span>
				</div>
				<!-- Icon Button -->
				<a href="/inbox" class="relative flex items-center justify-center text-white">
					<Notification class="h-6 w-6 hover:opacity-80" />
					{#if notificationCount > 0}
						<span class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"></span>
					{/if}
				</a>
			</div>
			<!-- Search Bar -->
			<div class="mt-5">
				<input
					type="text"
					placeholder="Search"
					class="w-full rounded-md bg-[#2A2836] px-4 py-2 text-sm text-gray-400 focus:outline-none focus:ring focus:ring-purple-500"
				/>
			</div>
		</div>

		<!-- Useful Section -->
		<div>
			<p class="text-xs uppercase text-gray-500">Useful</p>
			<nav class="mt-4 space-y-3">
				<a href="/dashboard" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Dashboard /></span>
					Dashboard
				</a>
				<a href="/productivity" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Barchart /></span>
					Productivity
				</a>
				<a href="/inbox" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Inbox /></span>
					Inbox
					{#if notificationCount > 0}
						<span
							class="ml-auto flex h-6 w-12 items-center justify-center rounded-full bg-red-500 text-sm text-white"
						>
							{notificationCount > 99 ? '99+' : notificationCount}
						</span>
					{/if}
				</a>
				<a href="/calendar" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Calender /></span>
					Calendar
				</a>
			</nav>
		</div>

		<!-- Activities Section -->
		<div>
			<p class="text-xs uppercase text-gray-500">Activities</p>
			<nav class="mt-4 space-y-3">
				<a href="/" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Home /></span>
					Home
				</a>
				<a href="/work" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Work /></span>
					Work
				</a>
				<a href="/sport" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Sport /></span>
					Sport
				</a>
				<a href="/personal" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Personal /></span>
					Personal
				</a>
				<a href="/courses" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Courses /></span>
					Courses
				</a>
			</nav>
		</div>

		<!-- General Section -->
		<div>
			<p class="text-xs uppercase text-gray-500">General</p>
			<nav class="mt-4 space-y-3">
				<a href="/settings" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Settings /></span>
					Settings
				</a>
				<a href="/help" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons"><Help /></span>
					Help
				</a>
			</nav>
		</div>
	</div>

	<!-- Bottom Section -->
	<div>
		<!-- White Line Separator -->
		<div class="my-4 border-t border-gray-600"></div>

		<!-- Profile Section -->
		<div class="flex items-center gap-3">
			<!-- Profile Picture -->
			<!-- svelte-ignore a11y_img_redundant_alt -->
			<img src={profileImage} alt="Profile Picture" class="h-10 w-10 rounded-full object-cover" />

			<!-- Display Name and Dropdown -->
			<div class="relative flex-1">
				<button
					on:click={toggleDropdown}
					class="flex w-full items-center justify-between text-white hover:text-purple-500"
				>
					<span class="whitespace-nowrap font-medium">{displayName}</span>
					<span class="material-icons"><Arrow /></span>
				</button>

				<!-- Dropdown Menu (Right-Side) -->
				{#if isDropdownOpen}
					<div
						bind:this={dropdownRef}
						use:clickOutside={() => (isDropdownOpen = null)}
						class="absolute bottom-0 left-full z-50 ml-2 w-40 rounded-md bg-[#2A2836] shadow-lg"
					>
						<!-- Profile Option -->
						<a
							href="/profile"
							class="block w-full px-4 py-2 text-left text-sm text-white hover:bg-[#5042A5]"
						>
							Profile
						</a>

						<!-- Logout Option -->
						<button
							on:click={logout}
							class="block w-full px-4 py-2 text-left text-sm text-white hover:bg-[#5042A5]"
						>
							Logout
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
