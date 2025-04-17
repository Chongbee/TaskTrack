<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, authHandlers } from '$lib/stores/authStore';
	import { notificationStore, notificationHandlers } from '$lib/stores/notificationStore';
	import { taskStore } from '$lib/stores/taskStore';
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
	import { db } from '$lib/firebase/firebase.client';
	import { collection, query, where, onSnapshot } from 'firebase/firestore';
	import { debounce } from '$lib/utils/debounce';
	import EditTask from '$lib/components/EditTask.svelte';
	import SearchTask from './SearchTask.svelte';
	import Close from '$lib/icons/Close.svelte';
	import { fly } from 'svelte/transition';
	export let task;

	let dropdownRef;
	let isDropdownOpen = false;
	let notificationCount = 0;
	let unsubscribeNotifications;
	let searchQuery = '';
	let searchResults = [];
	let showSearchResults = false;
	let selectedTask = null;
	let showSearchModal = false;

	// Reactive declarations
	$: displayName =
		$userStore.currentUser?.displayName || $authStore.currentUser?.displayName || 'Username';
	$: profileImage =
		$userStore.currentUser?.profileImage ||
		$authStore.currentUser?.photoURL ||
		'https://i.imgur.com/ucsOFUO.jpeg';
	$: notificationCount = $notificationStore.activeNotifications.length;

	// Fixed search function
	const performSearch = debounce(() => {
		if (searchQuery.trim() === '') {
			searchResults = [];
			showSearchResults = false;
			return;
		}

		const queryLower = searchQuery.toLowerCase();
		searchResults = ($taskStore.tasks || []).filter(
			(task) =>
				task.userId === $authStore.currentUser?.uid &&
				(task.title?.toLowerCase().includes(queryLower) ||
					task.description?.toLowerCase().includes(queryLower))
		);
		showSearchResults = true;
	}, 300);
	function handleSearchInput(e) {
		searchQuery = e.target.value;
		if (searchQuery.trim() === '') {
			searchResults = [];
			showSearchResults = false;
		} else {
			performSearch();
		}
	}

	function clearSearch() {
		searchQuery = '';
		searchResults = [];
		showSearchResults = false;
	}

	onMount(() => {
		const authUnsubscribe = authStore.subscribe((auth) => {
			if (auth.currentUser) {
				const notificationsRef = collection(db, 'notifications');
				const q = query(notificationsRef, where('userId', '==', auth.currentUser.uid));

				unsubscribeNotifications = onSnapshot(q, (snapshot) => {
					let notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

					notificationStore.update((state) => ({
						...state,
						isLoading: false,
						activeNotifications: notifications.filter((n) => !n.archived),
						archivedNotifications: notifications.filter((n) => n.archived)
					}));
				});
			}
		});

		return () => {
			authUnsubscribe();
			if (unsubscribeNotifications) unsubscribeNotifications();
		};
	});
	function openTaskViewModal(task) {
		showSearchModal = false;

		selectedTask = { ...task }; // Create a new object reference
		showSearchModal = true;
		showSearchResults = false;

		// Reset focus
		setTimeout(() => {
			if (typeof window !== 'undefined') {
				document.activeElement?.blur();
			}
		}, 0);
	}
	const logout = () => {
		authHandlers.logout().then(() => {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('searchStore');
				localStorage.removeItem('selectedServices');
			}
			goto('/signIn');
		});
	};
	function closeSearchModal() {
		showSearchModal = false;
		selectedTask = null;
		// Don't clear searchQuery here to allow multiple searches
		showSearchResults = false;

		// Return focus to search input
		setTimeout(() => {
			const searchInput = document.querySelector('input[type="text"]');
			searchInput?.focus();
		}, 50);
	}
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}
</script>

<div
	class="flex h-screen min-h-screen w-[300px] flex-col justify-between overflow-x-visible bg-[#181625] p-5 text-gray-400"
>
	<!-- Top Section -->
	<div class="space-y-8 overflow-x-visible">
		<!-- Logo and Search -->
		<div>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-1">
					<a href="/dashboard" class="flex items-center gap-1 no-underline hover:no-underline">
						<img src="tttlogo.png" alt="TaskTrack Logo" class="h-8 w-8" />
						<span class="text-lg font-semibold text-white">TaskTrack</span>
					</a>
				</div>
				<a href="/inbox" class="relative flex items-center justify-center text-white">
					<Notification class="h-6 w-6 hover:opacity-80" />
					{#if notificationCount > 0}
						<span class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"></span>
					{/if}
				</a>
			</div>

			<!-- Search Bar -->
			<div class="relative mt-5">
				<input
					type="text"
					placeholder="Search tasks..."
					class="w-full rounded-md bg-[#2A2836] px-4 py-2 text-sm text-gray-400 focus:outline-none focus:ring focus:ring-purple-500"
					bind:value={searchQuery}
					on:input={handleSearchInput}
					on:keydown={(e) => {
						if (e.key === 'Escape' && showSearchResults) {
							showSearchResults = false;
						}
					}}
					on:focus={() => (showSearchResults = true)}
				/>
				{#if searchQuery}
					<button
						on:click={clearSearch}
						class="absolute right-3 top-2.5 text-gray-500 hover:text-white"
					>
						×
					</button>
				{/if}

				<!-- Search Results -->
				{#if showSearchResults && searchResults.length > 0}
					<div
						class="absolute left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-md bg-[#2A2836] shadow-lg transition-all duration-200"
						in:fly={{ y: -10, duration: 150 }}
						out:fly={{ y: -10, duration: 150 }}
					>
						{#each searchResults as task}
							<button
								on:click|preventDefault={() => openTaskViewModal(task)}
								class="block w-full border-b border-gray-700 px-4 py-3 text-left text-sm text-white hover:bg-[#5042A5] focus:bg-[#5042A5] focus:outline-none"
							>
								<div class="font-medium">{task.title}</div>
								{#if task.description}
									<div class="truncate text-gray-400">{task.description}</div>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Navigation Sections -->
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

		<!-- More navigation sections... -->
	</div>

	<!-- Edit Task Modal -->
	{#if showSearchModal && selectedTask}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
			on:click|self={closeSearchModal}
		>
			<div class="w-full max-w-md rounded-lg p-6" on:click|stopPropagation>
				<button
					on:click={closeSearchModal}
					class="absolute right-4 top-4 text-gray-400 hover:text-white"
				>
					<Close class="h-6 w-6" />
				</button>
				<SearchTask task={selectedTask} onClose={closeSearchModal} />
			</div>
		</div>
	{/if}
	<!-- Bottom Profile Section -->
	<div class="sticky bottom-0 overflow-x-visible bg-[#181625] pt-4">
		<div class="my-4 border-t border-gray-600"></div>
		<div class="flex items-center gap-3">
			<img src={profileImage} alt="Profile Picture" class="h-10 w-10 rounded-full object-cover" />
			<div class="relative flex-1 overflow-visible">
				<button
					on:click={toggleDropdown}
					class="flex w-full items-center justify-between text-white hover:text-purple-500"
				>
					<span class="whitespace-nowrap font-medium">{displayName}</span>
					<span class="material-icons"><Arrow /></span>
				</button>
				{#if isDropdownOpen}
					<div
						bind:this={dropdownRef}
						use:clickOutside={() => (isDropdownOpen = null)}
						class="absolute bottom-0 left-full z-50 ml-2 w-40 rounded-md bg-[#2A2836] shadow-lg"
					>
						<a
							href="/profile"
							class="block w-full px-4 py-2 text-left text-sm text-white hover:bg-[#5042A5]"
						>
							Profile
						</a>
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
