<script>
	import { authHandlers, authStore } from '$lib/stores/authStore';

	let register = false;
	let email = '';
	let password = '';
	let confirmPassword = '';

	async function handleSubmit() {
		if (!email || !password || (register && !confirmPassword)) {
			return;
		}
		if (register && password === confirmPassword) {
			try {
				await authHandlers.signup(email, password);
			} catch (err) {
				console.log(err);
			}
		} else {
			try {
				await authHandlers.login(email, password);
			} catch (err) {
				console.log(err);
			}
		}
		if ($authStore.currentUser) {
			window.location.href = '/privatedashboard';
		}
	}
</script>

<div class="container">
	<h1>{register ? 'Register' : 'Log in'}</h1>
	<form>
		<label>
			<input bind:value={email} type="email" placeholder="Email" />
		</label>
		<label>
			<input bind:value={password} type="password" placeholder="Password" />
		</label>
		{#if register}
			<label>
				<input bind:value={confirmPassword} type="password" placeholder="Confirm Password" />
			</label>
		{/if}
		<button on:click={handleSubmit}>Submit</button>
	</form>
	{#if register}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:click={() => {
				register = false;
			}}
			on:keydown={() => {}}
		>
			Already have an account? <p>Log in</p>
		</div>
	{:else}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:click={() => {
				register = true;
			}}
			on:keydown={() => {}}
		>
			Don't have an account?
			<p>Sign Up</p>
		</div>
	{/if}
</div>

<style>
	.container {
		display: grid;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
	}
	.container form {
		display: flex;
		flex-direction: column;
	}
</style>
