<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import type { PageData } from './$types';

	export let data: PageData;

	let item = '';
	let quantity = '';
	let chantierId = '';
	let adding = false;

	let predicting = false;
	let predictions: { item: string; daysRemaining: number; recommendation: string }[] = [];

	async function addEntry() {
		const qty = Number(quantity);
		if (!item.trim() || Number.isNaN(qty)) return;
		adding = true;

		try {
			const res = await fetch('/api/stock', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ item, quantity: qty, chantierId: chantierId || null })
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Erreur serveur');

			item = '';
			quantity = '';
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			adding = false;
		}
	}

	async function runPrediction() {
		if (data.history.length === 0) {
			toast.warning('Ajoutez au moins une entrée de stock avant de prédire.');
			return;
		}
		predicting = true;
		predictions = [];

		try {
			const res = await fetch('/api/predict', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					history: data.history.map((h) => ({ item: h.item, date: h.recordedOn, quantity: h.quantity }))
				})
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Erreur serveur');

			predictions = body.predictions;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			predicting = false;
		}
	}
</script>

<svelte:head>
	<title>ChantierBot — Analyses</title>
</svelte:head>

<h1 class="mb-1 text-2xl font-bold">
	Analyses <span class="badge-ai ml-1 align-middle">✨ IA</span>
</h1>
<p class="mb-6 text-ink-secondary dark:text-ink-dark-secondary">Suivez votre consommation de matériaux et anticipez les ruptures de stock.</p>

<div class="mb-8 card">
	<h2 class="mb-3 font-semibold">Ajouter une entrée</h2>
	<form on:submit|preventDefault={addEntry} class="flex flex-col gap-2 sm:flex-row sm:items-end">
		<div class="flex flex-1 flex-col gap-1">
			<label for="item" class="text-sm font-medium">Matériau</label>
			<input id="item" type="text" bind:value={item} placeholder="Ex : Ciment 25kg" class="input" />
		</div>
		<div class="flex flex-col gap-1 sm:w-32">
			<label for="quantity" class="text-sm font-medium">Quantité restante</label>
			<input id="quantity" type="number" bind:value={quantity} class="input" />
		</div>
		<div class="flex flex-col gap-1 sm:w-48">
			<label for="chantier" class="text-sm font-medium">Chantier (optionnel)</label>
			<select id="chantier" bind:value={chantierId} class="input">
				<option value="">Général</option>
				{#each data.chantiers as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</div>
		<button type="submit" disabled={adding || !item.trim() || quantity === ''} class="btn-primary">
			{adding ? 'Ajout...' : 'Ajouter'}
		</button>
	</form>
</div>

<div class="mb-8 flex items-center justify-between">
	<h2 class="font-semibold">Historique récent</h2>
	<button type="button" on:click={runPrediction} disabled={predicting} class="btn-secondary">
		{predicting ? 'Prédiction en cours...' : '✨ Prédire les ruptures'}
	</button>
</div>

{#if data.history.length === 0}
	<p class="mb-8 text-ink-secondary dark:text-ink-dark-secondary">Aucune entrée de stock pour le moment.</p>
{:else}
	<ul class="mb-8 flex flex-col gap-2">
		{#each data.history as h (h.id)}
			<li class="flex items-center justify-between rounded-md border border-black/5 px-4 py-2 text-sm dark:border-white/5">
				<span class="font-medium">{h.item}</span>
				<span class="text-ink-secondary dark:text-ink-dark-secondary">
					{h.quantity} · {h.chantierName ?? 'Général'} · {new Date(h.recordedOn).toLocaleDateString('fr-FR')}
				</span>
			</li>
		{/each}
	</ul>
{/if}

{#if predictions.length > 0}
	<h2 class="mb-3 font-semibold">Prédictions</h2>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
		{#each predictions as p}
			<li class="card">
				<p class="font-semibold">{p.item}</p>
				<p class="text-2xl font-extrabold {p.daysRemaining <= 3 ? 'text-danger' : 'text-primary'}">
					{p.daysRemaining} j
				</p>
				<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">{p.recommendation}</p>
			</li>
		{/each}
	</ul>
{/if}
