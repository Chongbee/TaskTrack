<script>
	import { onMount } from 'svelte';
	import Grid from '$lib/icons/Grid.svelte';
	import List from '$lib/icons/List.svelte';
	import Clock from '$lib/icons/Clock.svelte';
	import DotsVertical from '$lib/icons/DotsVertical.svelte';

	// Example FAQ data
	const faqs = [
		{
			question: 'How do I create a new task?',
			answer: 'Click the "Add Task" button on the homepage and fill out the task details.'
		},
		{
			question: 'How do I edit or delete a task?',
			answer: 'Click the three dots (⋮) next to a task and select "Edit" or "Delete".'
		},
		{
			question: 'How do I switch between day and week views?',
			answer:
				'Use the toggle buttons at the top of the homepage to switch between "Day" and "Week" views.'
		},
		{
			question: 'How do I mark a task as completed?',
			answer: 'Check the checkbox next to the task to mark it as completed.'
		}
	];

	let activeIndex = null;

	function toggleFAQ(index) {
		activeIndex = activeIndex === index ? null : index;
	}
</script>

<div class="flex h-screen flex-col justify-between bg-[#181625] p-8 text-gray-400">
	<!-- Top Section -->
	<div class="space-y-8">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<img src="tttlogo.png" alt="TaskTrack Logo" class="h-8 w-8" />
				<span class="text-lg font-semibold text-white">TaskTrack Help</span>
			</div>
		</div>

		<!-- Search Bar -->
		<div>
			<input
				type="text"
				placeholder="Search help articles..."
				class="w-full rounded-md bg-[#2A2836] px-4 py-2 text-sm text-gray-400 focus:outline-none focus:ring focus:ring-purple-500"
			/>
		</div>

		<!-- FAQ Section -->
		<div class="space-y-4">
			<h2 class="text-md font-bold text-white">Frequently Asked Questions</h2>
			{#each faqs as faq, index (index)}
				<div
					class="rounded-md bg-[#2A2836] p-4 shadow transition-all hover:bg-[#3A3846]"
					on:click={() => toggleFAQ(index)}
				>
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-semibold text-white">{faq.question}</h3>
						<span class="text-gray-500">
							{activeIndex === index ? '▲' : '▼'}
						</span>
					</div>
					{#if activeIndex === index}
						<p class="mt-2 text-sm text-gray-400">{faq.answer}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="text-center text-sm text-gray-500">
		<p>
			Need more help? Contact us at <a
				href="mailto:support@tasktrack.com"
				class="text-purple-500 hover:underline">support@tasktrack.com</a
			>.
		</p>
	</div>
</div>

<style>
	.rounded-md {
		border-radius: 0.375rem;
	}
	.shadow {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	.transition-all {
		transition: all 0.2s ease;
	}
	.hover\:bg-\[\#3A3846\]:hover {
		background-color: #3a3846;
	}
</style>
