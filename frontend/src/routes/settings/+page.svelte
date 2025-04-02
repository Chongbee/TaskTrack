<script>
	import { onMount } from 'svelte';
	import { authStore, authHandlers } from '$lib/stores/authStore';
	import { userStore, userHandlers } from '$lib/stores/userStore';
	import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { auth } from '$lib/firebase/firebase.client';
	import {
		EmailAuthProvider,
		reauthenticateWithCredential,
		updateProfile,
		updateEmail,
		updatePassword
	} from 'firebase/auth';

	// User data
	let displayName = '';
	let email = '';
	let bio = '';
	let phoneNumber = '';
	let profileImage = '';
	let newPassword = '';
	let isEditing = false;
	let isLoading = false;
	let error = '';
	let currentPassword = '';

	// New state variables
	let showChangeEmail = false;
	let showChangePassword = false;
	let newEmail = '';
	let passwordChangeCurrent = '';
	let passwordChangeNew = '';
	let emailChangeCurrent = '';

	// Fetch user data on mount
	onMount(async () => {
		authStore.subscribe((state) => {
			if (state.currentUser) {
				displayName = state.currentUser.displayName || '';
				email = state.currentUser.email || '';
				newEmail = email; // Initialize newEmail with current email
				profileImage = state.currentUser.photoURL || 'https://i.imgur.com/ucsOFUO.jpeg';
			}
		});

		userStore.subscribe((state) => {
			if (state.currentUser) {
				bio = state.currentUser.description || '';
				phoneNumber = state.currentUser.phoneNumber || '';
			}
		});
	});

	// Handle profile picture upload
	async function uploadProfilePicture(file) {
		try {
			const storage = getStorage();
			const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}/${file.name}`);
			await uploadBytes(storageRef, file);
			const downloadURL = await getDownloadURL(storageRef);
			profileImage = downloadURL;
			await updateProfile(auth.currentUser, { photoURL: downloadURL });
			await userHandlers.updateUser(auth.currentUser.uid, { profileImage: downloadURL });
			alert('Profile picture updated successfully!');
		} catch (err) {
			console.error('Error uploading profile picture:', err);
			error = 'Failed to upload profile picture.';
		}
	}

	const date = new Date();
	const formattedDate = `${date.toLocaleString('en-US', { weekday: 'long' })}, ${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })}, ${date.getFullYear()}`;

	// Save basic profile changes (no password required)
	async function saveChanges() {
		try {
			// 1. Update Firebase Auth
			await updateProfile(auth.currentUser, {
				displayName: displayName,
				photoURL: profileImage
			});

			// 2. Update Firestore
			await userHandlers.updateUser(auth.currentUser.uid, {
				displayName: displayName,
				profileImage: profileImage,
				description: bio,
				phoneNumber: phoneNumber
			});

			// 3. Force refresh auth store
			await authHandlers.initializeUser(auth.currentUser);

			alert('Profile updated successfully!');
			isEditing = false;
		} catch (err) {
			console.error('Error updating profile:', err);
			error = 'Failed to update profile. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Change email (requires password)
	async function changeEmail() {
		isLoading = true;
		error = '';

		try {
			// Re-authenticate the user
			const credential = EmailAuthProvider.credential(auth.currentUser.email, emailChangeCurrent);
			await reauthenticateWithCredential(auth.currentUser, credential);

			// Update email
			await updateEmail(auth.currentUser, newEmail);

			// Update local state
			email = newEmail;

			alert('Email updated successfully!');
			showChangeEmail = false;
			emailChangeCurrent = '';
		} catch (err) {
			console.error('Error changing email:', err);
			error = 'Failed to change email. Please check your current password.';
		} finally {
			isLoading = false;
		}
	}

	// Change password (requires current password)
	async function changePassword() {
		isLoading = true;
		error = '';

		try {
			// Re-authenticate the user
			const credential = EmailAuthProvider.credential(
				auth.currentUser.email,
				passwordChangeCurrent
			);
			await reauthenticateWithCredential(auth.currentUser, credential);

			// Update password
			await updatePassword(auth.currentUser, passwordChangeNew);

			alert('Password updated successfully!');
			showChangePassword = false;
			passwordChangeCurrent = '';
			passwordChangeNew = '';
		} catch (err) {
			console.error('Error changing password:', err);
			error = 'Failed to change password. Please check your current password.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="p-6">
	<!-- Page Header -->
	<div class="flex w-full min-w-[200px] flex-wrap items-center justify-between gap-2">
		<div class="whitespace-nowrap text-lg font-bold text-black">Settings</div>
		<div class="flex items-center gap-3 whitespace-nowrap">
			<div class="text-sm font-bold text-gray-500">{formattedDate}</div>
		</div>
	</div>

	<!-- Profile Picture -->
	<div class="mt-6 flex items-center gap-4">
		<img src={profileImage} alt="Profile Picture" class="h-24 w-24 rounded-full object-cover" />
		{#if isEditing}
			<input
				type="file"
				accept="image/*"
				on:change={(e) => uploadProfilePicture(e.target.files[0])}
				class="text-sm"
			/>
		{/if}
	</div>

	<!-- Name -->
	<div class="mt-6">
		<label class="block text-sm font-bold text-gray-500">User Name</label>
		{#if isEditing}
			<input type="text" bind:value={displayName} class="mt-1 w-full rounded-md border p-2" />
		{:else}
			<div class="mt-1 text-lg font-semibold text-black">{displayName}</div>
		{/if}
	</div>

	<!-- Email -->
	<div class="mt-4">
		<label class="block text-sm font-bold text-gray-500">Email</label>
		{#if isEditing}
			<div class="mt-1 text-lg font-semibold text-black">{email}</div>
			<button
				on:click={() => (showChangeEmail = true)}
				class="mt-2 text-sm text-[#5042A5] underline"
			>
				Change Email
			</button>
		{:else}
			<div class="mt-1 text-lg font-semibold text-black">{email}</div>
		{/if}
	</div>

	<!-- Bio -->
	<div class="mt-4">
		<label class="block text-sm font-bold text-gray-500">Bio</label>
		{#if isEditing}
			<textarea bind:value={bio} class="mt-1 w-full rounded-md border p-2" rows="3"></textarea>
		{:else}
			<div class="mt-1 text-lg font-semibold text-black">{bio}</div>
		{/if}
	</div>

	<!-- Phone Number -->
	<div class="mt-4">
		<label class="block text-sm font-bold text-gray-500">Phone Number</label>
		{#if isEditing}
			<input type="tel" bind:value={phoneNumber} class="mt-1 w-full rounded-md border p-2" />
		{:else}
			<div class="mt-1 text-lg font-semibold text-black">{phoneNumber}</div>
		{/if}
	</div>

	<!-- Change Email Modal -->
	{#if showChangeEmail}
		<div class="mt-4 rounded-md border border-gray-200 p-4">
			<h3 class="mb-2 text-lg font-bold">Change Email</h3>
			<div class="mb-2">
				<label class="block text-sm font-bold text-gray-500">Current Password</label>
				<input
					type="password"
					bind:value={emailChangeCurrent}
					class="mt-1 w-full rounded-md border p-2"
					placeholder="Enter your current password"
				/>
			</div>
			<div class="mb-2">
				<label class="block text-sm font-bold text-gray-500">New Email</label>
				<input type="email" bind:value={newEmail} class="mt-1 w-full rounded-md border p-2" />
			</div>
			<div class="flex gap-2">
				<button
					on:click={changeEmail}
					disabled={isLoading}
					class="rounded-md bg-[#5042A5] px-4 py-2 text-white disabled:opacity-50"
				>
					{isLoading ? 'Saving...' : 'Save Email'}
				</button>
				<button
					on:click={() => {
						showChangeEmail = false;
						newEmail = email; // Reset to current email
						emailChangeCurrent = '';
					}}
					class="rounded-md bg-gray-500 px-4 py-2 text-white"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Change Password Button -->
	{#if isEditing && !showChangePassword}
		<div class="mt-4">
			<button on:click={() => (showChangePassword = true)} class="text-sm text-[#5042A5] underline">
				Change Password
			</button>
		</div>
	{/if}

	<!-- Change Password Modal -->
	{#if showChangePassword}
		<div class="mt-4 rounded-md border border-gray-200 p-4">
			<h3 class="mb-2 text-lg font-bold">Change Password</h3>
			<div class="mb-2">
				<label class="block text-sm font-bold text-gray-500">Current Password</label>
				<input
					type="password"
					bind:value={passwordChangeCurrent}
					class="mt-1 w-full rounded-md border p-2"
					placeholder="Enter your current password"
				/>
			</div>
			<div class="mb-2">
				<label class="block text-sm font-bold text-gray-500">New Password</label>
				<input
					type="password"
					bind:value={passwordChangeNew}
					class="mt-1 w-full rounded-md border p-2"
					placeholder="Enter new password"
				/>
			</div>
			<div class="flex gap-2">
				<button
					on:click={changePassword}
					disabled={isLoading}
					class="rounded-md bg-[#5042A5] px-4 py-2 text-white disabled:opacity-50"
				>
					{isLoading ? 'Saving...' : 'Save Password'}
				</button>
				<button
					on:click={() => {
						showChangePassword = false;
						passwordChangeCurrent = '';
						passwordChangeNew = '';
					}}
					class="rounded-md bg-gray-500 px-4 py-2 text-white"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="mt-4 text-sm text-red-500">{error}</div>
	{/if}

	<!-- Edit/Save Button -->
	<div class="mt-6">
		{#if isEditing}
			<button
				on:click={saveChanges}
				disabled={isLoading}
				class="rounded-md bg-[#5042A5] px-4 py-2 text-white disabled:opacity-50"
			>
				{isLoading ? 'Saving...' : 'Save Profile'}
			</button>
			<button
				on:click={() => {
					isEditing = false;
					showChangeEmail = false;
					showChangePassword = false;
				}}
				class="ml-2 rounded-md bg-gray-500 px-4 py-2 text-white"
			>
				Cancel
			</button>
		{:else}
			<button
				on:click={() => (isEditing = true)}
				class="rounded-md bg-[#5042A5] px-4 py-2 text-white"
			>
				Edit Profile
			</button>
		{/if}
	</div>
</div>
