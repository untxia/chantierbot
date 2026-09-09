<script lang="ts">
	import { page } from '$app/stores';
	import { navItems } from './nav-items';
	import NavIcon from './NavIcon.svelte';

	$: currentPath = $page.url.pathname;
	function isActive(href: string) {
		return href === '/' ? currentPath === '/' : currentPath.startsWith(href);
	}
</script>

<aside class="hidden w-60 shrink-0 flex-col bg-dark-navy px-4 py-6 md:flex">
	<a href="/" class="mb-8 inline-block px-2">
		<img src="/logo/logo-horizontal-dark.svg" alt="ChantierBot" class="h-7 w-auto" />
	</a>

	<nav class="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
		{#each navItems as item (item.href)}
			<a
				href={item.href}
				aria-current={isActive(item.href) ? 'page' : undefined}
				class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-fast {isActive(
					item.href
				)
					? 'bg-white/10 text-white'
					: 'text-ink-dark-secondary hover:bg-white/5 hover:text-white'}"
			>
				<NavIcon icon={item.icon} />
				{item.label}
			</a>
		{/each}
	</nav>
</aside>
