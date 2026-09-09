<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let name = '';
	let creating = false;

	async function createChantier() {
		if (!name.trim()) return;
		creating = true;

		try {
			const res = await fetch('/api/chantiers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Erreur serveur');

			toast.success(`Chantier « ${name.trim()} » créé.`);
			name = '';
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head>
	<title>ChantierBot — Projets</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">Projets</h1>

<form on:submit|preventDefault={createChantier} class="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end">
	<div class="flex flex-1 flex-col gap-1">
		<label for="chantier-name" class="font-semibold">Nouveau chantier</label>
		<input
			id="chantier-name"
			type="text"
			bind:value={name}
			placeholder="Ex : Rénovation salle de bain — Mme Dupont"
			class="input"
		/>
	</div>
	<button type="submit" disabled={creating || !name.trim()} class="btn-primary">
		{creating ? 'Création...' : 'Créer'}
	</button>
</form>

{#if data.chantiers.length === 0}
	<p class="text-ink-secondary dark:text-ink-dark-secondary">Aucun chantier pour le moment.</p>
{:else}
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
		{#each data.chantiers as chantier (chantier.id)}
			<li>
				<a href="/chantiers/{chantier.id}" class="card block hover:border-primary/40 dark:hover:border-primary/40">
					<div class="mb-1 flex items-start justify-between gap-2">
						<h2 class="font-semibold">{chantier.name}</h2>
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
