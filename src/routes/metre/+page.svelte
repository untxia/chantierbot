<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast';
	import {
		METIERS,
		SOURCES,
		ErreurMetre,
		chiffrer,
		clePrix,
		parametresParDefaut,
		trouverOuvrage,
		versBrouillonDevis,
		type Parametres,
		type ResultatMetre
	} from '$lib/metre';
	import type { PageData } from './$types';

	export let data: PageData;

	const nf = (x: number, d = 2) => x.toLocaleString('fr-FR', { maximumFractionDigits: d });

	// Point de départ : ?ouvrage=…&surface=…&chantier=… (lien depuis une mesure ou un chantier)
	const q = $page.url.searchParams;
	let code = trouverOuvrage(q.get('ouvrage') ?? '')?.code ?? 'carrelage-sol';
	let chantierId = data.chantiers.some((c) => c.id === q.get('chantier')) ? (q.get('chantier') as string) : '';

	/** Paramètres passés dans l'adresse (lien depuis une mesure ou depuis l'assistant). */
	function depuisAdresse(): Parametres {
		const depart: Parametres = {};
		for (const c of trouverOuvrage(code)!.champs) {
			const v = q.get(c.id);
			if (v === null || v === '') continue;
			if (c.type === 'number' && Number.isFinite(Number(v))) depart[c.id] = Number(v);
			else if (c.type === 'select' && c.options.some((o) => o.valeur === v)) depart[c.id] = v;
			else if (c.type === 'boolean') depart[c.id] = v === 'true';
		}
		return depart;
	}
	let params: Parametres = parametresParDefaut(trouverOuvrage(code)!, depuisAdresse());

	$: ouvrage = trouverOuvrage(code)!;

	function changerOuvrage(nouveau: string) {
		const surface = params.surface;
		code = nouveau;
		params = parametresParDefaut(trouverOuvrage(nouveau)!, surface ? { surface } : {});
	}

	function reprendreMesure(id: string) {
		const m = data.surfaces.find((s) => s.id === id);
		if (!m) return;
		params = { ...params, surface: m.value };
		if (m.chantierId) chantierId = m.chantierId;
	}

	let resultat: ResultatMetre | null = null;
	let erreur = '';
	$: {
		try {
			resultat = Number(params.surface) > 0 ? ouvrage.calculer(params) : null;
			erreur = '';
		} catch (e) {
			resultat = null;
			erreur = e instanceof ErreurMetre ? e.message : 'Calcul impossible.';
		}
	}

	$: sourcesUtilisees = resultat
		? [...new Set(resultat.lignes.flatMap((l) => l.sources))].map((id) => SOURCES[id]).filter(Boolean)
		: [];

	let detail = false;

	function texteListe(): string {
		if (!resultat) return '';
		const chantier = data.chantiers.find((c) => c.id === chantierId)?.name;
		const lignes = resultat.lignes.map((l) => {
			const achat = l.achat ? `${l.achat.nombre} × ${l.achat.conditionnement}` : `${nf(l.quantiteAvecPerte)} ${l.unite}`;
			return `- ${l.designation} : ${achat} (besoin ${nf(l.quantiteAvecPerte)} ${l.unite})`;
		});
		return [`Fournitures — ${resultat.ouvrage}, ${nf(Number(params.surface))} m²${chantier ? ` — ${chantier}` : ''}`, ...lignes].join('\n');
	}

	// Prix de l'artisan : mémorisés sur cet appareil (par fourniture, et main-d'œuvre par ouvrage).
	const PRIX_KEY = 'chantierbot-prix-metre';
	const MO_KEY = 'chantierbot-mo-metre';
	const DEVIS_KEY = 'chantierbot-draft-quote';
	let prix: Record<string, number> = {};
	let mainOeuvre: Record<string, number> = {};
	const lire = (k: string) => {
		try {
			const v = JSON.parse(localStorage.getItem(k) ?? '{}');
			return v && typeof v === 'object' ? (v as Record<string, number>) : {};
		} catch {
			return {};
		}
	};
	const ecrire = (k: string, v: unknown) => {
		try {
			localStorage.setItem(k, JSON.stringify(v));
		} catch {
			/* stockage indisponible : les prix valent pour la session */
		}
	};
	onMount(() => {
		prix = lire(PRIX_KEY);
		mainOeuvre = lire(MO_KEY);
	});
	function fixerPrix(cle: string, valeur: string) {
		prix = { ...prix, [cle]: Math.max(0, Number(valeur) || 0) };
		ecrire(PRIX_KEY, prix);
	}
	function fixerMainOeuvre(valeur: string) {
		mainOeuvre = { ...mainOeuvre, [code]: Math.max(0, Number(valeur) || 0) };
		ecrire(MO_KEY, mainOeuvre);
	}
	$: chiffrage = resultat ? chiffrer(resultat, Number(params.surface), prix, mainOeuvre[code] ?? 0) : null;
	const euros = (x: number) => x.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

	function creerDevis() {
		if (!resultat || !chiffrage) return;
		try {
			if (localStorage.getItem(DEVIS_KEY) && !confirm('Un brouillon de devis existe déjà. Le remplacer ?')) return;
		} catch {
			/* stockage indisponible */
		}
		const metier = METIERS.find((m) => m.ouvrages.some((o) => o.code === code))?.label ?? '';
		ecrire(
			DEVIS_KEY,
			versBrouillonDevis({ resultat, surface: Number(params.surface), chiffrage, chantierId: chantierId || null, metier, avertissements: resultat.avertissements })
		);
		toast.success('Brouillon de devis créé.');
		goto('/rapports');
	}

	async function copier() {
		try {
			await navigator.clipboard.writeText(texteListe());
			toast.success('Liste copiée.');
		} catch {
			toast.error('Copie impossible sur ce navigateur.');
		}
	}
</script>

<svelte:head>
	<title>ChantierBot — Métré</title>
</svelte:head>

<h1 class="mb-1 text-2xl font-bold">Métré</h1>
<p class="mb-6 text-ink-secondary dark:text-ink-dark-secondary">
	Calculez les fournitures à partir d’une surface : quantités, pertes et nombre de sacs ou de cartons à acheter.
</p>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
	<section class="card p-6 print:hidden" aria-labelledby="metre-form">
		<h2 id="metre-form" class="mb-4 text-lg font-bold">Ouvrage</h2>

		<div class="mb-4 flex flex-col gap-1">
			<label for="ouvrage" class="text-sm font-semibold">Type de travaux</label>
			<select id="ouvrage" class="input" value={code} on:change={(e) => changerOuvrage(e.currentTarget.value)}>
				{#each METIERS as m}
					<optgroup label={m.label}>
						{#each m.ouvrages as o}<option value={o.code}>{o.designation}</option>{/each}
					</optgroup>
				{/each}
			</select>
			<p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">{ouvrage.description}</p>
		</div>

		{#if data.surfaces.length > 0}
			<div class="mb-4 flex flex-col gap-1">
				<label for="mesure" class="text-sm font-semibold">Reprendre une surface mesurée</label>
				<select id="mesure" class="input" on:change={(e) => reprendreMesure(e.currentTarget.value)}>
					<option value="">Choisir…</option>
					{#each data.surfaces as s (s.id)}
						<option value={s.id}>{s.label} — {nf(s.value)} m²{s.chantierName ? ` (${s.chantierName})` : ''}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div class="mb-4 flex flex-col gap-1">
			<label for="chantier" class="text-sm font-semibold">Chantier (optionnel)</label>
			<select id="chantier" class="input" bind:value={chantierId}>
				<option value="">Aucun</option>
				{#each data.chantiers as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
			</select>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			{#each ouvrage.champs as c (c.id)}
				<div class="flex flex-col gap-1 {c.id === 'surface' ? 'sm:col-span-2' : ''}">
					{#if c.type === 'boolean'}
						<label class="mt-5 flex items-center gap-2 text-sm font-semibold">
							<input type="checkbox" checked={params[c.id] === true} on:change={(e) => (params = { ...params, [c.id]: e.currentTarget.checked })} />
							{c.label}
						</label>
					{:else if c.type === 'select'}
						<label for={c.id} class="text-sm font-semibold">{c.label}</label>
						<select id={c.id} class="input" value={String(params[c.id])} on:change={(e) => (params = { ...params, [c.id]: e.currentTarget.value })}>
							{#each c.options as o}<option value={o.valeur}>{o.label}</option>{/each}
						</select>
					{:else}
						<label for={c.id} class="text-sm font-semibold">{c.label}{c.unite ? ` (${c.unite})` : ''}</label>
						<input
							id={c.id}
							type="number"
							inputmode="decimal"
							class="input"
							min={c.min}
							max={c.max}
							step={c.pas ?? 1}
							value={params[c.id]}
							on:input={(e) => (params = { ...params, [c.id]: e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value) })}
						/>
					{/if}
					{#if c.aide}<p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">{c.aide}</p>{/if}
				</div>
			{/each}
		</div>
	</section>

	<section class="card p-6" aria-labelledby="metre-resultat" aria-live="polite">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
			<h2 id="metre-resultat" class="text-lg font-bold">Fournitures</h2>
			{#if resultat}
				<div class="flex gap-2 print:hidden">
					<button type="button" class="btn-secondary px-3 py-1.5 text-sm" on:click={() => (detail = !detail)}>{detail ? 'Masquer' : 'Voir'} le calcul</button>
					<button type="button" class="btn-secondary px-3 py-1.5 text-sm" on:click={copier}>Copier la liste</button>
					<button type="button" class="btn-secondary px-3 py-1.5 text-sm" on:click={() => window.print()}>Imprimer</button>
				</div>
			{/if}
		</div>

		{#if erreur}
			<p class="rounded-lg bg-danger/10 p-3 text-sm text-danger">{erreur}</p>
		{:else if !resultat}
			<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Indiquez une surface pour lancer le calcul.</p>
		{:else}
			<p class="mb-3 text-sm font-semibold">{resultat.ouvrage} — {nf(Number(params.surface))} m²</p>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-black/10 text-left text-xs uppercase tracking-wide text-ink-secondary dark:border-white/10 dark:text-ink-dark-secondary">
							<th class="py-2 pr-3">Fourniture</th>
							<th class="py-2 pr-3">Besoin</th>
							<th class="py-2">À acheter</th>
						</tr>
					</thead>
					<tbody>
						{#each resultat.lignes as l (l.code)}
							<tr class="border-b border-black/5 align-top dark:border-white/5">
								<td class="py-2 pr-3">
									<span class="font-semibold">{l.designation}</span>
									{#if l.fiabilite === 'estimation'}<span class="ml-1 rounded bg-warning/15 px-1.5 text-xs text-warning">estimation</span>{/if}
									{#if detail}<p class="mt-1 text-xs text-ink-secondary dark:text-ink-dark-secondary">{l.calcul}</p>{/if}
								</td>
								<td class="whitespace-nowrap py-2 pr-3">{l.unite === 'u' ? Math.ceil(l.quantiteAvecPerte - 1e-9) : nf(l.quantiteAvecPerte)} {l.unite}</td>
								<td class="py-2 font-bold">
									{#if l.achat}{l.achat.nombre} <span class="font-normal">{l.achat.conditionnement === 'à l’unité' ? (l.achat.nombre > 1 ? 'pièces' : 'pièce') : `× ${l.achat.conditionnement}`}</span>{:else}—{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if resultat.avertissements.length}
				<ul class="mt-4 space-y-1 text-sm">
					{#each resultat.avertissements as a}<li class="rounded-lg bg-warning/10 px-3 py-2">⚠ {a}</li>{/each}
				</ul>
			{/if}

			<p class="mt-4 text-xs text-ink-secondary dark:text-ink-dark-secondary">
				Valeurs usuelles tirées de fiches techniques de fabricants : <strong>vérifiez la fiche du produit choisi</strong> (format, peigne,
				support). Les prix ne sont pas inclus : saisissez ceux de votre fournisseur ci-dessous.
			</p>

			{#if chiffrage}
				<div class="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
					<h3 class="mb-1 font-bold">Chiffrage et devis</h3>
					<p class="mb-3 text-xs text-ink-secondary dark:text-ink-dark-secondary">
						Vos prix HT par unité d’achat, mémorisés sur cet appareil pour les prochains calculs.
					</p>
					<ul class="space-y-2 text-sm">
						{#each chiffrage.lignes.filter((l) => l.type === 'material') as l (l.code)}
							<li class="flex flex-wrap items-center justify-between gap-2">
								<span class="min-w-0 flex-1">{l.description} <span class="text-xs text-ink-secondary dark:text-ink-dark-secondary">({l.unite.includes(' ') ? `${nf(l.quantite)} × ${l.unite}` : `${nf(l.quantite)} ${l.unite}`})</span></span>
								<label class="flex items-center gap-1 text-xs">
									<span class="sr-only">Prix HT de {l.description}</span>
									<input type="number" min="0" step="0.01" inputmode="decimal" class="input w-24 py-1 text-right" value={l.prixUnitaire || ''} placeholder="0,00" on:change={(e) => fixerPrix(clePrix(l.code, l.unite), e.currentTarget.value)} /> €
								</label>
								<span class="w-24 text-right font-semibold">{euros(l.total)}</span>
							</li>
						{/each}
						<li class="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2 dark:border-white/5">
							<span class="min-w-0 flex-1">Main-d’œuvre (pose) <span class="text-xs text-ink-secondary dark:text-ink-dark-secondary">au m²</span></span>
							<label class="flex items-center gap-1 text-xs">
								<span class="sr-only">Prix HT de la main-d’œuvre au m²</span>
								<input type="number" min="0" step="0.5" inputmode="decimal" class="input w-24 py-1 text-right" value={mainOeuvre[code] || ''} placeholder="0,00" on:change={(e) => fixerMainOeuvre(e.currentTarget.value)} /> €/m²
							</label>
							<span class="w-24 text-right font-semibold">{euros(chiffrage.totalMainOeuvre)}</span>
						</li>
					</ul>
					<div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3 dark:border-white/10">
						<div class="text-sm">
							<p>Matériaux : <strong>{euros(chiffrage.totalMateriaux)}</strong> · Main-d’œuvre : <strong>{euros(chiffrage.totalMainOeuvre)}</strong></p>
							<p class="text-lg">Total HT : <strong class="text-primary">{euros(chiffrage.total)}</strong></p>
							{#if chiffrage.sansPrix > 0}<p class="text-xs text-warning">{chiffrage.sansPrix} fourniture{chiffrage.sansPrix > 1 ? 's' : ''} sans prix.</p>{/if}
						</div>
						<button type="button" class="btn-primary print:hidden" on:click={creerDevis}>Créer le brouillon de devis</button>
					</div>
				</div>
			{/if}
			{#if sourcesUtilisees.length}
				<details class="mt-2 text-xs print:hidden">
					<summary class="cursor-pointer font-semibold">Sources des règles de calcul</summary>
					<ul class="mt-1 list-inside list-disc">
						{#each sourcesUtilisees as s (s.id)}<li><a class="underline" href={s.url} target="_blank" rel="noopener">{s.titre}</a></li>{/each}
					</ul>
				</details>
			{/if}
		{/if}
	</section>
</div>
