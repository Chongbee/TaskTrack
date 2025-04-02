<script>
	//@ts-nocheck
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase/firebase.client';
	import { authStore } from '$lib/stores/authStore';
	import { browser } from '$app/environment';
	import Nav from '$lib/components/Nav.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { userHandlers } from '$lib/stores/userStore';

	$: userID = $authStore?.currentUser?.uid;

	const fetchUser = async () => {
		await userHandlers.getUser(userID);
	};

	let isLoggedIn = false;

	$: isLoggedIn = $authStore?.currentUser !== null;

	$: if (userID) {
		fetchUser();
	}

	onMount(async () => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			authStore.update((curr) => {
				return { ...curr, isLoading: false, currentUser: user };
			});

			if (browser) {
				const currentRoute = $page.url.pathname;

				if (!user && currentRoute !== '/newuser') {
					goto('/signIn');
				}
			}
		});
		return unsubscribe;
	});

	const handleSignUpRedirect = () => {
		goto('/newuser');
	};
</script>

<div class="app h-screen w-screen">
	<div class="flex h-screen">
		{#if isLoggedIn}
			<Nav />
		{:else}
			<div class="auth-buttons">
				<button on:click={handleSignUpRedirect}></button>
			</div>
		{/if}

		<main class="flex-1 overflow-auto bg-[#F5F6FD]">
			<slot></slot>
		</main>
	</div>
</div>

<style>
	/* Reset margin and padding on the body */
	body,
	html {
		margin: 0;
		padding: 0;
		height: 100%;
		width: 100%;
	}

	.app {
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
