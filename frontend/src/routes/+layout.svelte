<script>
	//@ts-ignore
	import Header from '$lib/components/Header.svelte';
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase/firebase.client';
	import { authStore } from '$lib/stores/authStore';
	import { browser } from '$app/environment';
	import Nav from '$lib/components/Nav.svelte';

	onMount(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			console.log(user);
			authStore.update((curr) => {
				return { ...curr, isLoading: false, currentUser: user };
			});

			if (
				browser &&
				!$authStore?.currentUser &&
				!$authStore.isLoading &&
				window.location.pathname !== '/'
			) {
				window.location.href = '/';
			}
		});
		return unsubscribe;
	});
</script>

<div class="app">
	<div class="flex">
		<Nav />

		<main>
			<slot></slot>
		</main>
	</div>

	<footer>
		<p>This is my footer</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
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
