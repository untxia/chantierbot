<script lang="ts">
	import { page } from '$app/stores';
	import { mobileNavItems } from './nav-items';
	import NavIcon from './NavIcon.svelte';

	$: currentPath = $page.url.pathname;
	function isActive(href: string) {
		return href === '/' ? currentPath === '/' : currentPath.startsWith(href);
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-40 flex border-t border-black/5 bg-surface/95 backdrop-blur md:hidden dark:border-white/5 dark:bg-surface-dark/95"
	aria-label="Navigation principale"
>
	{#each mobileNavItems as item (item.href)}
		<a
			href={item.href}
			aria-current={isActive(item.href) ? 'page' : undefined}
			class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium {isActive(item.href)
				? 'text-primary'
				: 'text-ink-secondary dark:text-ink-dark-secondary'}"
		>
			<NavIcon icon={item.icon} />
			{item.label}
		</a>
	{/each}
</nav>
