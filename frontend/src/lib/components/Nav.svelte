<!-- <script>
</script>

<div class="flex h-screen w-[300px] flex-col justify-between gap-5 bg-[#181625] p-5">
	<div>
		<p>this is my nav</p>
		<p>Search</p>
		<p>Useful</p>
		<div class="flex flex-col gap-5">
			<a class="font-bold text-white" href="/about">Dashboard</a>
			<a class="font-bold text-white" href="/about">Productivity</a>
			<a class="font-bold text-white" href="/about">Inbox</a>
			<a class="font-bold text-white" href="/about">Calendar</a>
		</div>
		<p>Activities</p>
		<div class="flex flex-col gap-5">
			<a class="font-bold text-white" href="/about">Home</a>
			<a class="font-bold text-white" href="/about">Work</a>
			<a class="font-bold text-white" href="/about">Sport</a>
			<a class="font-bold text-white" href="/about">Personal</a>
			<a class="font-bold text-white" href="/about">Courses</a>
		</div>
		<p>General</p>
		<div class="flex flex-col gap-5">
			<a class="font-bold text-white" href="/about">Settings</a>
			<a class="font-bold text-white" href="/about">Help</a>
		</div>
	</div>
	<div>
		<p>profile</p>
	</div>
</div> -->

<!-- <a class="font-bold text-white" href="/">home</a>
	<a class="font-bold text-white" href="/about">about</a>
	<a class="font-bold text-white" href="/signIn">Sign in</a> -->

<script>
	import { goto } from '$app/navigation';
	import { authHandlers } from '$lib/stores/authStore';
	const logout = () => {
		authHandlers.logout().then(() => {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('searchStore');
				localStorage.removeItem('selectedServices');
			}
			goto('/signIn'); // Redirect after cleanup
		});
	};
</script>

<div class="flex h-screen w-[300px] flex-col justify-between bg-[#181625] p-5 text-gray-400">
	<!-- Top Section -->
	<div class="space-y-8">
		<!-- Logo and Search -->
		<div>
			<div class="flex items-center gap-3">
				<!-- <img src="logo-placeholder.svg" alt="TaskTrack Logo" class="h-6 w-6" /> -->
				<span class="text-lg font-semibold text-white">TaskTrack</span>
			</div>
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
					<span class="material-icons">🤳</span>
					Dashboard
				</a>
				<a href="/productivity" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">🎂</span>
					Productivity
				</a>
				<a href="/inbox" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">😊</span>
					Inbox <span class="ml-auto text-sm text-red-500">99+</span>
				</a>
				<a href="/calendar" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">📅</span>
					Calendar
				</a>
			</nav>
		</div>

		<!-- Activities Section -->
		<div>
			<p class="text-xs uppercase text-gray-500">Activities</p>
			<nav class="mt-4 space-y-3">
				<a href="/" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">🏠</span>
					Home
				</a>
				<a href="/work" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">💪</span>
					Work
				</a>
				<a href="/sport" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">👷‍♀️</span>
					Sport
				</a>
				<a href="/personal" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">🧔</span>
					Personal
				</a>
				<a href="/courses" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">🏫</span>
					Courses
				</a>
			</nav>
		</div>

		<!-- General Section -->
		<div>
			<p class="text-xs uppercase text-gray-500">General</p>
			<nav class="mt-4 space-y-3">
				<a href="/settings" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">☸</span>
					Settings
				</a>
				<a href="/help" class="flex items-center gap-3 text-white hover:text-purple-500">
					<span class="material-icons">🆘</span>
					Help
				</a>
			</nav>
		</div>
	</div>

	<!-- Bottom Section -->
	<div>
		<div class="flex items-center gap-3">
			<!-- <img
				src="profile-placeholder.jpg"
				alt="Profile Picture"
				class="h-10 w-10 rounded-full border-2 border-gray-600"
			/> -->
			<div>
				<p class="font-medium text-white">Username</p>

				<a href="/profile" class="text-sm text-purple-500">View Profile</a>
				<button type="button" on:click={logout} class="text-white">Logout</button>
			</div>
		</div>
	</div>
</div>
