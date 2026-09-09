<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PhotoUpload from '$lib/components/photoUpload.svelte';
	import { photoPublicUrl } from '$lib/services/supabase';
	import { toast } from '$lib/stores/toast';
	import type { PageData } from './$types';

	export let data: PageData;

	let updatingStatus = false;
	let progress = data.chantier.progress;
	let updatingProgress = false;

	async function patchChantier(update: Record<string, unknown>) {
		const res = await fetch(`/api/chantiers/${data.chantier.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update)
		});
		if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur');
	}

	async function updateStatus(e: Event) {
		updatingStatus = true;
		try {
			await patchChantier({ status: (e.target as HTMLSelectElement).value });
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			updatingStatus = false;
		}
	}

	async function commitProgress() {
		if (progress === data.chantier.progress) return;
		updatingProgress = true;
		try {
			await patchChantier({ progress });
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			updatingProgress = false;
		}
	}
</script>

<svelte:head>
	<title>{data.chantier.name} — ChantierBot</title>
</svelte:head>

<a href="/projets" class="mb-4 inline-block text-sm text-ink-secondary hover:text-primary hover:underline dark:text-ink-dark-secondary">← Chantiers</a>

<div class="mb-2 flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-2xl font-bold">{data.chantier.name}</h1>
	<select
		value={data.chantier.status}
		on:change={updateStatus}
		disabled={updatingStatus}
		class="input w-auto"
		aria-label="Statut du chantier"
	>
		<option value="en_cours">En cours</option>
		<option value="en_attente">En attente</option>
		<option value="termine">Terminé</option>
	</select>
</div>

<div class="mb-6 flex items-center gap-3">
	<input
		type="range"
		min="0"
		max="100"
		step="5"
		bind:value={progress}
		on:change={commitProgress}
		disabled={updatingProgress}
		class="h-2 flex-1 accent-primary"
		aria-label="Avancement du chantier"
	/>
	<span class="w-12 text-right text-sm font-semibold">{progress}%</span>
</div>

<PhotoUpload chantierId={data.chantier.id} />

<section class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4" aria-label="Photos analysées">
	{#each data.photos as photo (photo.id)}
		<article class="card">
			<img src={photoPublicUrl(photo.image_path)} alt={photo.description ?? ''} class="mb-2 rounded-md" />
			{#if photo.error}
				<p class="text-danger">{photo.error}</p>
			{:else}
				<div class="space-y-1 text-sm">
					<p>{photo.description}</p>
					{#if photo.issues?.length}
						<p><strong>Problèmes :</strong> {photo.issues.join(', ')}</p>
					{/if}
					{#if photo.materials?.length}
						<p><strong>Matériaux :</strong> {photo.materials.join(', ')}</p>
					{/if}
					{#if photo.progress_estimate}
						<p><strong>Avancement :</strong> {photo.progress_estimate}</p>
					{/if}
				</div>
			{/if}
		</article>
	{/each}
</section>

{#if data.photos.length === 0}
	<p class="text-ink-secondary dark:text-ink-dark-secondary">Aucune photo pour ce chantier pour le moment.</p>
{/if}
