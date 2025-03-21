<script>
	export let task;
	export let style;
	import EditTask from '$lib/components/EditTask.svelte';
	import { taskHandlers } from '$lib/stores/taskStore';
</script>

<div {style} class="z-[100] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
	<ul class="py-1">
		<li>
			<EditTask newTask={task} customDuration={task.taskDuration} />
		</li>
		<li>
			<button
				class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
				on:click={() => {
					taskHandlers.deleteTask(task.id);
				}}
			>
				Delete
			</button>
		</li>
	</ul>
</div>
