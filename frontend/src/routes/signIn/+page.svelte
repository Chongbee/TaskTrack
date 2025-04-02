<script>
	import { authHandlers, authStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	let register = false;
	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = '';

	async function handleSubmit() {
		error = '';
		if (!email || !password || (register && !confirmPassword)) {
			error = 'Please fill in all fields';
			return;
		}
		if (register && password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		try {
			if (register) {
				await authHandlers.signup(email, password);
			} else {
				// First check if email exists
				try {
					await authHandlers.login(email, password);
				} catch (err) {
					if (err.code === 'auth/wrong-password') {
						error = 'Incorrect password';
						return;
					} else if (err.code === 'auth/user-not-found') {
						error = 'No account found with this email';
						return;
					}
					throw err; // Re-throw other errors
				}
			}

			if ($authStore.currentUser) {
				goto('/');
			}
		} catch (err) {
			console.error('Auth error:', err);

			if (err.code === 'auth/email-already-in-use') {
				error = 'Email already in use';
			} else if (!register) {
				// This handles other login errors not caught above
				error = 'Login failed. Please try again.';
			} else {
				error = 'Registration failed. Please try again.';
			}
		}
	}
</script>

<!-- The rest of your template remains the same -->

<div class="flex h-screen flex-col md:flex-row">
	<!-- Left Column: Authentication Form -->
	<div
		class="flex w-full flex-col items-center justify-center bg-gray-900 px-6 py-10 text-white md:w-1/2 md:p-12"
	>
		<div class="mb-6 w-full max-w-md rounded-lg bg-gray-800 p-6 text-center shadow-lg">
			<h2 class="text-2xl font-bold text-purple-400 md:text-3xl">Welcome to TaskTrack!</h2>
			<p class="mt-2 text-gray-400">Your ultimate task management solution.</p>
		</div>

		<img src="/logo.png" alt="TaskTrack Logo" class="mb-6 w-60 md:w-80" />

		<!-- Form -->
		<div class="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-lg md:p-8">
			<h2 class="text-xl font-semibold text-gray-300 md:text-2xl">
				{register ? 'Register' : 'Log in'}
			</h2>

			<!-- Error Message -->
			{#if error}
				<div class="mb-4 rounded-md bg-red-500/20 p-3 text-center text-red-400">
					{error}
				</div>
			{/if}

			<form class="mt-4 space-y-3">
				<input
					bind:value={email}
					type="email"
					placeholder="Email"
					class="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
				/>
				<input
					bind:value={password}
					type="password"
					placeholder="Password"
					class="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
				/>
				{#if register}
					<input
						bind:value={confirmPassword}
						type="password"
						placeholder="Confirm Password"
						class="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
					/>
				{/if}
				<button
					type="button"
					on:click={handleSubmit}
					class="w-full rounded-md bg-purple-500 p-3 font-semibold text-white transition duration-300 hover:bg-purple-600"
				>
					Submit
				</button>
			</form>

			<!-- Toggle Login/Register -->
			<div
				class="mt-4 cursor-pointer text-center text-gray-400"
				on:click={() => {
					register = !register;
					error = ''; // Clear error when toggling
				}}
			>
				{#if register}
					Already have an account?
					<span class="font-bold text-purple-400">Log in</span>
				{:else}
					Don't have an account?
					<span class="font-bold text-purple-400">Sign Up</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Right Column: Image (Hidden on Small Screens) -->
	<div class="hidden h-full w-1/2 overflow-hidden bg-white md:block">
		<img src="woman.jpg" class="h-full w-full object-cover" alt="Task Management Illustration" />
	</div>
</div>

<!-- Footer -->
<footer class="bg-gray-900 p-4 text-center text-xs text-white md:text-sm">
	<p class="font-semibold text-purple-400">
		More Time, More Possibilities. TaskTrack Your Way to Success. Join today!
	</p>
</footer>
