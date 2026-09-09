<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import ThemeToggle from './ThemeToggle.svelte';

	export let variant: 'light' | 'dark' = 'light';

	let query = '';
	let langOpen = false;

	function search() {
		if (!query.trim()) return;
		goto(`/projets?q=${encodeURIComponent(query.trim())}`);
	}

	const languages = [
		{ code: 'FR', label: 'Français', available: true },
		{ code: 'EN', label: 'English', available: false },
		{ code: 'ES', label: 'Español', available: false },
		{ code: 'EU', label: 'Euskara', available: false }
	];

	function pickLanguage(lang: (typeof languages)[number]) {
		langOpen = false;
		if (!lang.available) toast.info(`${lang.label} arrive bientôt.`);
	}
</script>

<div class="flex items-center gap-2 {variant === 'dark' ? 'text-white' : 'text-ink dark:text-ink-dark'}">
	<form on:submit|preventDefault={search} class="hidden sm:block">
		<input
			type="search"
			bind:value={query}
			placeholder="Rechercher un chantier..."
			aria-label="Rechercher un chantier"
			class="w-48 rounded-full border-0 bg-black/5 px-4 py-2 text-sm placeholder:text-current placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40 {variant ===
			'dark'
				? 'bg-white/10 text-white'
				: 'dark:bg-white/10 dark:text-ink-dark'}"
		/>
	</form>

	<ThemeToggle />

	<div class="relative">
		<button
			type="button"
			on:click={() => (langOpen = !langOpen)}
			aria-haspopup="listbox"
			aria-expanded={langOpen}
			class="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium {variant === 'dark'
				? 'bg-white/10'
				: 'bg-black/5 dark:bg-white/10'}"
		>
			🇫🇷 FR ▾
		</button>
		{#if langOpen}
			<ul
				role="listbox"
				class="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-md border border-black/5 bg-surface py-1 text-sm text-ink shadow-card dark:border-white/10 dark:bg-surface-dark dark:text-ink-dark"
			>
				{#each languages as lang}
					<li>
						<button
							type="button"
							on:click={() => pickLanguage(lang)}
							class="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 {!lang.available
								? 'opacity-50'
								: ''}"
						>
							{lang.label}
							{#if !lang.available}<span class="text-xs">bientôt</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<a
		href="/parametres"
		class="flex h-9 w-9 items-center justify-center rounded-full font-semibold {variant === 'dark'
			? 'bg-white/10'
			: 'bg-black/5 dark:bg-white/10'}"
		aria-label="Mon compte"
	>
		👤
	</a>
</div>
