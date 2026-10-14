<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast';
	import { formatValue, type Kind } from '$lib/measure';
	import ArMeasure from '$lib/components/ArMeasure.svelte';
	import PhotoMeasure from '$lib/components/PhotoMeasure.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let kind: Kind = 'longueur';
	let tab: 'ar' | 'photo' = 'photo';
	let arSupported = false;
	let isIos = false;
	let checked = false;
	let ar: ArMeasure;

	let result: { value: number; kind: Kind; method: 'ar' | 'photo' } | null = null;
	let label = '';
	// Présélection depuis la fiche chantier (/mesures?chantier=<id>), si l'id existe bien.
	const requested = $page.url.searchParams.get('chantier') ?? '';
	let chantierId = data.chantiers.some((c) => c.id === requested) ? requested : '';
	let saving = false;

	onMount(async () => {
		isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		try {
			const xr = (navigator as any).xr;
			arSupported = !!xr && (await xr.isSessionSupported('immersive-ar'));
		} catch {
			arSupported = false;
		}
		if (arSupported) tab = 'ar';
		checked = true;
	});

	function onDone(method: 'ar' | 'photo') {
		return (e: CustomEvent<{ value: number; kind: Kind }>) => {
			result = { ...e.detail, method };
		};
	}

	async function save() {
		if (!result) return;
		saving = true;
		try {
			const res = await fetch('/api/mesures', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind: result.kind,
					value: result.value,
					method: result.method,
					label,
					chantier_id: chantierId || null
				})
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.error ?? 'Erreur serveur');
			toast.success('Mesure enregistrée.');
			result = null;
			label = '';
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
		} finally {
			saving = false;
		}
	}

	async function remove(id: string) {
		if (!confirm('Supprimer cette mesure ?')) return;
		try {
			const res = await fetch('/api/mesures', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur serveur');
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
		}
	}

	const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
</script>

<svelte:head>
	<title>ChantierBot — Mesures</title>
</svelte:head>

<h1 class="mb-1 text-2xl font-bold">Mesures</h1>
<p class="mb-6 text-ink-secondary dark:text-ink-dark-secondary">
	Mesurez longueurs et surfaces sur chantier avec la caméra de votre téléphone.
</p>

{#if result}
	<div class="card mb-8">
		<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">
			Mesure {result.method === 'ar' ? 'en réalité augmentée' : 'sur photo'}
		</p>
		<p class="mb-4 text-3xl font-extrabold">{formatValue(result.value, result.kind)}</p>
		<form on:submit|preventDefault={save} class="grid gap-3 sm:grid-cols-2">
			<div class="flex flex-col gap-1">
				<label for="m-label" class="text-sm font-medium">Libellé</label>
				<input id="m-label" type="text" bind:value={label} placeholder="Ex : Mur salon, largeur fenêtre" class="input" />
			</div>
			<div class="flex flex-col gap-1">
				<label for="m-chantier" class="text-sm font-medium">Chantier (optionnel)</label>
				<select id="m-chantier" bind:value={chantierId} class="input">
					<option value="">Aucun</option>
					{#each data.chantiers as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex gap-2 sm:col-span-2">
				<button type="submit" class="btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
				<button type="button" class="btn-secondary" on:click={() => (result = null)}>Abandonner</button>
			</div>
		</form>
	</div>
{:else}
	<div class="card mb-8">
		<div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Type de mesure">
			<button type="button" class={kind === 'longueur' ? 'btn-primary' : 'btn-secondary'} on:click={() => (kind = 'longueur')}>Longueur</button>
			<button type="button" class={kind === 'surface' ? 'btn-primary' : 'btn-secondary'} on:click={() => (kind = 'surface')}>Surface</button>
		</div>

		<div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Méthode">
			<button type="button" class={tab === 'ar' ? 'btn-primary' : 'btn-secondary'} on:click={() => (tab = 'ar')}>Réalité augmentée</button>
			<button type="button" class={tab === 'photo' ? 'btn-primary' : 'btn-secondary'} on:click={() => (tab = 'photo')}>Sur photo</button>
		</div>

		{#if tab === 'ar'}
			{#if !checked}
				<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Vérification de la compatibilité…</p>
			{:else if arSupported}
				<p class="mb-3 text-sm text-ink-secondary dark:text-ink-dark-secondary">
					Pointez la caméra vers une surface, touchez pour poser chaque point.
					{kind === 'surface' ? 'Posez au moins 3 points pour le contour.' : 'Enchaînez les points pour additionner les segments.'}
				</p>
				<button type="button" class="btn-primary" on:click={() => ar.start()}>Lancer la mesure AR</button>
			{:else}
				<p class="text-sm">
					{#if isIos}
						<strong>La réalité augmentée en direct n’est pas disponible sur iPhone</strong> : Safari ne prend pas en charge WebXR.
					{:else}
						<strong>La réalité augmentée n’est pas disponible sur cet appareil ou ce navigateur</strong> (il faut Chrome sur un Android compatible ARCore).
					{/if}
					Utilisez l’onglet « Sur photo » : même résultat avec un objet de référence.
				</p>
			{/if}
		{:else}
			<PhotoMeasure {kind} on:done={onDone('photo')} />
		{/if}
	</div>
{/if}

<!-- Toujours monté : son overlay doit exister avant le démarrage de la session. -->
<ArMeasure bind:this={ar} {kind} on:done={onDone('ar')} on:error={(e) => toast.error(e.detail)} />

<h2 class="mb-3 font-semibold">Mesures enregistrées</h2>
{#if data.mesures.length === 0}
	<p class="text-ink-secondary dark:text-ink-dark-secondary">Aucune mesure pour le moment.</p>
{:else}
	<ul class="flex flex-col gap-2">
		{#each data.mesures as m (m.id)}
			<li class="card flex flex-wrap items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="font-semibold">{m.label ?? (m.kind === 'surface' ? 'Surface' : 'Longueur')}</p>
					<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">
						{m.chantierName ?? 'Sans chantier'} · {m.method === 'ar' ? 'AR' : 'Photo'} · {dateFmt.format(new Date(m.createdAt))}
					</p>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xl font-extrabold">{formatValue(m.value, m.kind)}</span>
					<button type="button" class="btn-secondary px-3 py-1 text-sm" on:click={() => remove(m.id)}>Supprimer</button>
				</div>
			</li>
		{/each}
	</ul>
{/if}
