<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';

	const styles = {
		success: 'border-success/30 bg-success/10 text-success',
		info: 'border-primary/30 bg-primary/10 text-primary',
		warning: 'border-warning/30 bg-warning/10 text-warning',
		error: 'border-danger/30 bg-danger/10 text-danger'
	};

	const icons = {
		success: '✓',
		info: 'ℹ',
		warning: '⚠',
		error: '✕'
	};
</script>

<div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
	{#each $toast as t (t.id)}
		<div
			role="status"
			transition:fly={{ y: -12, duration: 250 }}
			class="pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium shadow-card {styles[t.kind]} bg-surface dark:bg-surface-dark"
		>
			<span aria-hidden="true">{icons[t.kind]}</span>
			<p class="flex-1 text-ink dark:text-ink-dark">{t.message}</p>
			<button
				type="button"
				on:click={() => toast.dismiss(t.id)}
				class="text-ink-secondary hover:text-ink dark:text-ink-dark-secondary dark:hover:text-ink-dark"
				aria-label="Fermer la notification"
			>
				✕
			</button>
		</div>
	{/each}
</div>
