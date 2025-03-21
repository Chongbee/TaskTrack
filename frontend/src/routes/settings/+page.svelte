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
	// Fetch user data on mount
	onMount(async () => {
		authStore.subscribe((state) => {
			if (state.currentUser) {
				displayName = state.currentUser.displayName || '';
				email = state.currentUser.email || '';
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
	// Handle form submission
	async function saveChanges() {
		isLoading = true;
		error = '';

		try {
			// Re-authenticate the user
			const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
			await reauthenticateWithCredential(auth.currentUser, credential);

			// Update Firebase Auth profile
			await updateProfile(auth.currentUser, {
				displayName: displayName,
				photoURL: profileImage
			});

			// Update email if changed
			if (email !== auth.currentUser.email) {
				await updateEmail(auth.currentUser, email);
			}

			// Update password if provided
			if (newPassword) {
				await updatePassword(auth.currentUser, newPassword);
			}

			// Update Firestore user data
			await userHandlers.updateUser(auth.currentUser.uid, {
				description: bio,
				phoneNumber: phoneNumber,
				profileImage: profileImage
			});

			alert('Profile updated successfully!');
			isEditing = false;
		} catch (err) {
			console.error('Error updating profile:', err);
			error = 'Failed to update profile. Please try again.';
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
			<input type="email" bind:value={email} class="mt-1 w-full rounded-md border p-2" />
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

	<!-- Password -->
	{#if isEditing}
		<div class="mt-4">
			<label class="block text-sm font-bold text-gray-500">Current Password</label>
			<input
				type="password"
				bind:value={currentPassword}
				class="mt-1 w-full rounded-md border p-2"
				placeholder="Enter your current password"
			/>
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
				{isLoading ? 'Saving...' : 'Save Changes'}
			</button>
			<button
				on:click={() => (isEditing = false)}
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
