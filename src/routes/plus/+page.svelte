<script lang="ts">
	import NavIcon from '$lib/components/NavIcon.svelte';
	import { navItems } from '$lib/components/nav-items';

	const items = navItems.filter((i) => !['/', '/projets', '/ia'].includes(i.href));
</script>

<svelte:head>
	<title>ChantierBot — Plus</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">Plus</h1>

<ul class="flex flex-col gap-2">
	{#each items as item (item.href)}
		<li>
			<a href={item.href} class="card flex items-center gap-3 hover:border-primary/40">
				<NavIcon icon={item.icon} />
				<span class="flex-1 font-semibold">{item.label}</span>
				{#if item.soon}
					<span class="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-ink-secondary dark:bg-white/10 dark:text-ink-dark-secondary">bientôt</span>
				{/if}
			</a>
		</li>
	{/each}
</ul>
