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
		<div class="relative">
			<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-60">⌕</span>
			<input
				type="search"
				bind:value={query}
				placeholder="Rechercher un chantier..."
				aria-label="Rechercher un chantier"
				class="w-56 rounded-full border border-transparent bg-black/5 py-2.5 pl-9 pr-4 text-sm placeholder:text-current placeholder:opacity-60 transition-colors focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 {variant ===
				'dark'
					? 'bg-white/10 text-white'
					: 'dark:bg-white/10 dark:text-ink-dark'}"
			/>
		</div>
	</form>

	<ThemeToggle />

	<div class="relative">
		<button
			type="button"
			on:click={() => (langOpen = !langOpen)}
			aria-haspopup="listbox"
			aria-expanded={langOpen}
			class="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold transition-colors {variant === 'dark'
				? 'bg-white/10 hover:bg-white/15'
				: 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15'}"
		>
			🇫🇷 FR <span class="text-xs opacity-60">▾</span>
		</button>
		{#if langOpen}
			<ul
				role="listbox"
				class="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-black/5 bg-surface py-1 text-sm text-ink shadow-card-hover dark:border-white/10 dark:bg-surface-dark dark:text-ink-dark"
			>
				{#each languages as lang}
					<li>
						<button
							type="button"
							on:click={() => pickLanguage(lang)}
							class="flex w-full items-center justify-between px-3 py-2.5 text-left font-medium hover:bg-black/5 dark:hover:bg-white/5 {!lang.available ? 'opacity-50' : ''}"
						>
							<span>{lang.label}</span>
							{#if lang.available}<span class="text-xs font-bold text-success">✓</span>{:else}<span class="text-xs">bientôt</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<a
		href="/parametres"
		class="flex h-10 w-10 items-center justify-center rounded-full font-bold transition-colors {variant === 'dark'
			? 'bg-white/10 hover:bg-white/15'
			: 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15'}"
		aria-label="Mon compte"
	>
		👤
	</a>
</div>
