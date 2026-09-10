<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PhotoUpload from '$lib/components/photoUpload.svelte';
	import DeleteChantierButton from '$lib/components/DeleteChantierButton.svelte';
	import { toast } from '$lib/stores/toast';
	import type { PageData } from './$types';

	export let data: PageData;
	let editing = false;
	let saving = false;
	let updatingStatus = false;
	let progress = data.chantier.progress ?? 0;
	let updatingProgress = false;
	let name = data.chantier.name;
	let description = data.chantier.description ?? '';
	let address = data.chantier.address ?? '';
	let clientId = data.chantier.client_id ?? '';
	let startDate = data.chantier.start_date ?? '';
	let endDate = data.chantier.end_date ?? '';
	let budget = data.chantier.budget ?? '';
	$: clients = data.clients ?? [];

	function resetForm() {
		name = data.chantier.name; description = data.chantier.description ?? ''; address = data.chantier.address ?? '';
		clientId = data.chantier.client_id ?? ''; startDate = data.chantier.start_date ?? ''; endDate = data.chantier.end_date ?? ''; budget = data.chantier.budget ?? '';
	}
	async function patchChantier(update: Record<string, unknown>) {
		const res = await fetch(`/api/chantiers/${data.chantier.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) });
		const body = await res.json().catch(() => ({})); if (!res.ok) throw new Error(body.error ?? 'Erreur serveur');
	}
	async function saveDetails() {
		if (!name.trim()) return; saving = true;
		try { await patchChantier({ name, description, address, client_id: clientId || null, start_date: startDate || null, end_date: endDate || null, budget: budget === '' ? null : Number(budget) }); toast.success('Chantier mis à jour.'); editing = false; await invalidateAll(); }
		catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur inconnue'); } finally { saving = false; }
	}
	async function updateStatus(e: Event) { updatingStatus = true; try { await patchChantier({ status: (e.target as HTMLSelectElement).value }); await invalidateAll(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur inconnue'); } finally { updatingStatus = false; } }
	async function commitProgress() { if (progress === data.chantier.progress) return; updatingProgress = true; try { await patchChantier({ progress }); await invalidateAll(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Erreur inconnue'); } finally { updatingProgress = false; } }
	function formatDate(value: string | null) { if (!value) return '—'; return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`)); }
	function formatBudget(value: number | null) { if (value === null || value === undefined) return '—'; return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value); }
</script>

<svelte:head><title>{data.chantier.name} — ChantierBot</title></svelte:head>
<div class="mx-auto max-w-6xl">
	<a href="/projets" class="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-secondary hover:text-primary dark:text-ink-dark-secondary">← Retour aux chantiers</a>
	<header class="card mb-6 overflow-hidden p-6 sm:p-8">
		<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
			<div class="min-w-0">
				<p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">Fiche chantier</p>
				{#if editing}<input class="input text-2xl font-bold" bind:value={name} aria-label="Nom du chantier" />{:else}<h1 class="text-3xl font-extrabold tracking-tight">{data.chantier.name}</h1>{/if}
				<p class="mt-2 text-sm text-ink-secondary dark:text-ink-dark-secondary">Créé le {formatDate(data.chantier.created_at?.slice(0, 10) ?? null)}</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<select value={data.chantier.status} on:change={updateStatus} disabled={updatingStatus} class="input w-auto" aria-label="Statut du chantier"><option value="en_cours">En cours</option><option value="en_attente">En attente</option><option value="termine">Terminé</option></select>
				{#if editing}<button class="btn-secondary" type="button" on:click={() => { resetForm(); editing = false; }}>Annuler</button><button class="btn-primary" type="button" on:click={saveDetails} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>{:else}<button class="btn-secondary" type="button" on:click={() => editing = true}>✏️ Modifier</button>{/if}
				<DeleteChantierButton chantierId={data.chantier.id} />
			</div>
		</div>
		<div class="mt-7 rounded-2xl bg-primary/5 p-4 dark:bg-primary/10"><div class="mb-2 flex items-center justify-between text-sm font-bold"><span>Avancement du chantier</span><span class="text-primary">{progress}%</span></div><input type="range" min="0" max="100" step="5" bind:value={progress} on:change={commitProgress} disabled={updatingProgress} class="h-2 w-full accent-primary" aria-label="Avancement du chantier" /><div class="mt-2 flex justify-between text-xs text-ink-secondary dark:text-ink-dark-secondary"><span>Début</span><span>Objectif : terminé à 100%</span></div></div>
	</header>

	{#if editing}
		<section class="card mb-6 p-6"><h2 class="mb-5 text-lg font-bold">Informations du chantier</h2><div class="grid gap-4 sm:grid-cols-2">
			<div class="sm:col-span-2"><label class="mb-1 block text-sm font-semibold" for="description">Description</label><textarea id="description" class="input min-h-28" bind:value={description} placeholder="Décris les travaux à réaliser…"></textarea></div>
			<div><label class="mb-1 block text-sm font-semibold" for="address">Adresse du chantier</label><input id="address" class="input" bind:value={address} placeholder="Adresse, ville…" /></div>
			<div><label class="mb-1 block text-sm font-semibold" for="client">Client</label><select id="client" class="input" bind:value={clientId}><option value="">Aucun client</option>{#each clients as client}<option value={client.id}>{client.name}</option>{/each}</select></div>
			<div><label class="mb-1 block text-sm font-semibold" for="start">Date de début</label><input id="start" class="input" type="date" bind:value={startDate} /></div>
			<div><label class="mb-1 block text-sm font-semibold" for="end">Date de fin prévue</label><input id="end" class="input" type="date" bind:value={endDate} /></div>
			<div><label class="mb-1 block text-sm font-semibold" for="budget">Budget (€)</label><input id="budget" class="input" type="number" min="0" step="0.01" bind:value={budget} placeholder="0,00" /></div>
		</div></section>
	{:else}
		<section class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="card"><p class="text-xs font-bold uppercase tracking-wide text-ink-secondary">Client</p><p class="mt-2 font-bold">{data.client?.name ?? 'Non renseigné'}</p>{#if data.client?.phone}<p class="mt-1 text-sm text-ink-secondary">📞 {data.client.phone}</p>{/if}</div><div class="card"><p class="text-xs font-bold uppercase tracking-wide text-ink-secondary">Dates</p><p class="mt-2 font-semibold">{formatDate(data.chantier.start_date)} → {formatDate(data.chantier.end_date)}</p></div><div class="card"><p class="text-xs font-bold uppercase tracking-wide text-ink-secondary">Budget</p><p class="mt-2 text-xl font-extrabold">{formatBudget(data.chantier.budget)}</p></div><div class="card"><p class="text-xs font-bold uppercase tracking-wide text-ink-secondary">Photos</p><p class="mt-2 text-xl font-extrabold">{data.photos.length}</p></div></section>
		<section class="card mb-6 p-6"><h2 class="mb-3 text-lg font-bold">📍 Informations</h2>{#if data.chantier.description}<p class="whitespace-pre-line text-sm leading-6">{data.chantier.description}</p>{:else}<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Ajoute une description pour garder les informations importantes du chantier au même endroit.</p>{/if}{#if data.chantier.address}<p class="mt-4 text-sm font-semibold">📍 {data.chantier.address}</p>{/if}</section>
	{/if}

	<section class="mb-6"><div class="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">Suivi terrain</p><h2 class="text-xl font-extrabold">Photos & analyses IA</h2></div><span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{data.photos.length} photo{data.photos.length > 1 ? 's' : ''}</span></div><div class="card mb-5 p-5"><PhotoUpload chantierId={data.chantier.id} /></div>
		{#if data.photos.length === 0}<div class="card p-10 text-center"><p class="text-lg font-bold">Aucune photo pour le moment 📸</p><p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Ajoute une photo du chantier pour lancer le suivi et l’analyse.</p></div>{:else}<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{#each data.photos as photo (photo.id)}<article class="card overflow-hidden p-0">{#if photo.image_url}<img src={photo.image_url} alt={photo.description ?? 'Photo du chantier'} class="aspect-[4/3] w-full object-cover" />{/if}<div class="space-y-3 p-5">{#if photo.error}<p class="font-semibold text-danger">{photo.error}</p>{:else}<p class="text-sm leading-6">{photo.description ?? 'Analyse disponible.'}</p>{#if photo.issues?.length}<div><p class="text-xs font-bold uppercase tracking-wide text-danger">Problèmes</p><p class="mt-1 text-sm">{photo.issues.join(' · ')}</p></div>{/if}{#if photo.materials?.length}<div><p class="text-xs font-bold uppercase tracking-wide text-primary">Matériaux</p><p class="mt-1 text-sm">{photo.materials.join(' · ')}</p></div>{/if}{#if photo.progress_estimate}<div><p class="text-xs font-bold uppercase tracking-wide text-ink-secondary">Estimation IA</p><p class="mt-1 text-sm">{photo.progress_estimate}</p></div>{/if}{/if}</div></article>{/each}</div>{/if}
	</section>
</div>
