<script lang="ts">
	import { page } from '$app/stores';
	import { navItems } from './nav-items';
	import { focusMode } from '$lib/stores/focus-mode';
	import NavIcon from './NavIcon.svelte';

	$: currentPath = $page.url.pathname;
	function isActive(href: string) {
		return href === '/' ? currentPath === '/' : currentPath.startsWith(href);
	}
</script>

{#if !$focusMode}
	<aside class="hidden w-64 shrink-0 flex-col bg-dark-navy px-4 py-6 md:flex">
		<a href="/" class="mb-8 flex items-center gap-3 px-2">
			<img src="/logo/icon.svg" alt="" class="h-9 w-9" />
			<div class="leading-tight">
				<p class="font-extrabold text-white">ChantierBot</p>
				<p class="text-xs text-ink-dark-secondary">L'IA qui avance vos chantiers</p>
			</div>
		</a>

		<nav class="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					aria-current={isActive(item.href) ? 'page' : undefined}
					class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-fast {isActive(
						item.href
					)
						? 'bg-white/10 text-white ring-1 ring-primary/40'
						: 'text-ink-dark-secondary hover:bg-white/5 hover:text-white'}"
				>
					<NavIcon icon={item.icon} />
					<span class="flex-1">{item.label}</span>
					{#if item.soon}
						<span class="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-ink-dark-secondary">bientôt</span>
					{/if}
				</a>
			{/each}
		</nav>

		<button
			type="button"
			on:click={() => focusMode.set(true)}
			class="mt-4 rounded-md bg-white/5 p-3 text-left text-white transition-colors hover:bg-white/10"
		>
			<p class="text-sm font-semibold">Passer en mode Focus chantier</p>
			<p class="text-xs text-ink-dark-secondary">Masque l'interface pour voir uniquement l'essentiel</p>
		</button>
	</aside>
{:else}
	<button
		type="button"
		on:click={() => focusMode.set(false)}
		class="fixed top-4 left-4 z-40 hidden rounded-full bg-dark-navy p-2.5 text-white shadow-card md:flex"
		aria-label="Quitter le mode focus"
	>
		<NavIcon icon="home" />
	</button>
{/if}
