<script lang="ts">
	import { theme } from '$lib/stores/theme';
</script>

<div class="inline-flex items-center gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10">
	<button
		type="button"
		on:click={() => theme.set('light')}
		aria-pressed={$theme === 'light'}
		aria-label="Thème clair"
		class="flex h-7 w-7 items-center justify-center rounded-full transition-colors {$theme === 'light'
			? 'bg-warning text-white'
			: 'text-ink-secondary dark:text-ink-dark-secondary'}"
	>
		☀
	</button>
	<button
		type="button"
		on:click={() => theme.set('dark')}
		aria-pressed={$theme === 'dark'}
		aria-label="Thème sombre"
		class="flex h-7 w-7 items-center justify-center rounded-full transition-colors {$theme === 'dark'
			? 'bg-dark-navy text-white'
			: 'text-ink-secondary dark:text-ink-dark-secondary'}"
	>
		☾
	</button>
</div>
