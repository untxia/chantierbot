<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	function formatRelative(iso: string | null): string {
		if (!iso) return 'Aucune activité pour le moment';
		const diffMs = Date.now() - new Date(iso).getTime();
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return "à l'instant";
		if (minutes < 60) return `il y a ${minutes} min`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `il y a ${hours} h`;
		const days = Math.floor(hours / 24);
		return `il y a ${days} j`;
	}

	const hour = new Date().getHours();
	const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';
</script>

<svelte:head>
	<title>ChantierBot — Accueil</title>
</svelte:head>

<h1 class="text-3xl font-extrabold tracking-tight">{greeting} 👋</h1>
<p class="mb-6 text-ink-secondary dark:text-ink-dark-secondary">Voici où en sont vos chantiers.</p>

<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
	<div class="card">
		<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Chantiers</p>
		<p class="text-3xl font-extrabold">{data.kpis.chantierCount}</p>
	</div>
	<div class="card">
		<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Photos analysées</p>
		<p class="text-3xl font-extrabold">{data.kpis.photoCount}</p>
	</div>
	<div class="card">
		<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Dernière activité</p>
		<p class="text-lg font-semibold">{formatRelative(data.kpis.lastActivity)}</p>
	</div>
</div>

<div class="mb-4 flex items-center justify-between">
	<h2 class="text-xl font-bold">Chantiers récents</h2>
	<a href="/projets" class="btn-secondary">+ Nouveau chantier</a>
</div>

{#if data.recentChantiers.length === 0}
	<p class="text-ink-secondary dark:text-ink-dark-secondary">
		Aucun chantier pour le moment. <a href="/projets" class="text-primary hover:underline">Créez le premier.</a>
	</p>
{:else}
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
		{#each data.recentChantiers as chantier (chantier.id)}
			<li>
				<a
					href="/chantiers/{chantier.id}"
					class="card block hover:border-primary/40 dark:hover:border-primary/40"
				>
					<div class="mb-1 flex items-start justify-between gap-2">
						<h3 class="font-semibold">{chantier.name}</h3>
						<StatusBadge status={chantier.status} />
					</div>
					<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">
						{chantier.photoCount} photo{chantier.photoCount > 1 ? 's' : ''}
					</p>
				</a>
			</li>
		{/each}
	</ul>
{/if}
