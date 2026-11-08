<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import {
		AGE_MAX_JOURS,
		TVA_DEFAUT,
		ageJours,
		lireCsv,
		trouverEntete,
		detecterColonnes,
		versLignes,
		ttc,
		type Cellule,
		type Colonnes,
		type ResultatImport
	} from '$lib/tarifs/import';
	import type { PageData } from './$types';

	export let data: PageData;

	const euros = (x: number) => x.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
	const dateFr = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-FR');
	const aujourdhui = new Date().toISOString().slice(0, 10);

	// --- Import
	let fournisseur = '';
	let dateTarif = aujourdhui;
	let nomFichier = '';
	let feuille: Cellule[][] = [];
	let indexEntete = 0;
	let colonnes: Colonnes | null = null;
	let tvaDefaut = TVA_DEFAUT;
	let lecture = false;
	let envoi = false;

	$: entetes = colonnes ? (feuille[indexEntete] ?? []).map((c, i) => String(c ?? `Colonne ${i + 1}`)) : [];
	$: resultat = colonnes ? versLignes(feuille.slice(indexEntete + 1), colonnes, tvaDefaut, indexEntete + 2) : null;

	const CHAMPS: { cle: keyof Colonnes; label: string; requis?: boolean }[] = [
		{ cle: 'designation', label: 'Désignation', requis: true },
		{ cle: 'reference', label: 'Référence' },
		{ cle: 'unite', label: 'Unité' },
		{ cle: 'prixHT', label: 'Prix HT' },
		{ cle: 'prixTTC', label: 'Prix TTC (si pas de HT)' },
		{ cle: 'tva', label: 'Taux de TVA' }
	];

	async function choisirFichier(e: Event) {
		const fichier = (e.currentTarget as HTMLInputElement).files?.[0];
		colonnes = null;
		feuille = [];
		if (!fichier) return;
		if (fichier.size > 15 * 1024 * 1024) {
			toast.error('Fichier trop lourd (15 Mo maximum).');
			return;
		}
		lecture = true;
		nomFichier = fichier.name;
		try {
			if (/\.xlsx$/i.test(fichier.name)) {
				const { default: lireXlsx } = await import('read-excel-file/browser');
				const feuilles = (await lireXlsx(fichier)) as unknown as { data: Cellule[][] }[];
				feuille = feuilles[0]?.data ?? [];
			} else if (/\.(csv|txt)$/i.test(fichier.name)) {
				feuille = lireCsv(await fichier.text());
			} else {
				throw new Error('Format non pris en charge : utilisez un fichier .xlsx ou .csv.');
			}
			const entete = trouverEntete(feuille);
			if (entete) {
				indexEntete = entete.index;
				colonnes = entete.colonnes;
			} else if (feuille.length > 1) {
				indexEntete = 0;
				colonnes = detecterColonnes(feuille[0]);
				toast.warning('Colonnes non reconnues automatiquement : choisissez-les ci-dessous.');
			} else {
				throw new Error('Le fichier semble vide.');
			}
			if (!fournisseur) fournisseur = fichier.name.replace(/\.(xlsx|csv|txt)$/i, '').replace(/[_-]+/g, ' ').slice(0, 60);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Lecture du fichier impossible.');
			colonnes = null;
		} finally {
			lecture = false;
		}
	}

	function changerColonne(cle: keyof Colonnes, valeur: string) {
		if (!colonnes) return;
		colonnes = { ...colonnes, [cle]: Number(valeur) };
	}

	async function importer(r: ResultatImport) {
		if (!fournisseur.trim() || r.lignes.length === 0) return;
		envoi = true;
		try {
			const res = await fetch('/api/tarifs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fournisseur, date_tarif: dateTarif || null, fichier: nomFichier, lignes: r.lignes })
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.error ?? 'Import impossible.');
			toast.success(`${body.tarif.lignes} articles importés pour ${fournisseur.trim()}.`);
			colonnes = null;
			feuille = [];
			nomFichier = '';
			fournisseur = '';
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Erreur.');
		} finally {
			envoi = false;
		}
	}

	async function supprimer(id: string, nom: string) {
		if (!confirm(`Supprimer le tarif « ${nom} » ? Les prix reliés au métré seront à refaire.`)) return;
		const res = await fetch('/api/tarifs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
		if (!res.ok) toast.error('Suppression impossible.');
		else {
			toast.success('Tarif supprimé.');
			await invalidateAll();
		}
	}

	// --- Recherche
	let q = '';
	let trouve: { id: string; reference: string | null; designation: string; unite: string | null; prix_ht: number; tva: number; tarifs: { fournisseur: string } | null }[] = [];
	let minuterie: ReturnType<typeof setTimeout>;
	function chercher() {
		clearTimeout(minuterie);
		minuterie = setTimeout(async () => {
			if (q.trim().length < 2) {
				trouve = [];
				return;
			}
			const res = await fetch(`/api/tarifs/recherche?q=${encodeURIComponent(q)}`);
			trouve = res.ok ? (await res.json()).lignes : [];
		}, 250);
	}
</script>

<svelte:head>
	<title>ChantierBot — Tarifs fournisseurs</title>
</svelte:head>

<h1 class="mb-1 text-2xl font-bold">Tarifs fournisseurs</h1>
<p class="mb-6 text-ink-secondary dark:text-ink-dark-secondary">
	Importez le tarif de vos fournisseurs (fichier Excel ou CSV téléchargé depuis votre compte pro) : vos prix HT, la TVA et le TTC
	alimentent le métré et vos devis.
</p>

{#if data.indisponible}
	<p class="card mb-6 border-warning/40 bg-warning/10 p-4 text-sm">
		Les tarifs ne sont pas encore activés sur la base de données (migration <code>20261108_tarifs_fournisseurs.sql</code> à exécuter).
	</p>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<section class="card p-6" aria-labelledby="import-titre">
		<h2 id="import-titre" class="mb-4 text-lg font-bold">Importer un tarif</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			<div class="flex flex-col gap-1">
				<label for="fournisseur" class="text-sm font-semibold">Fournisseur</label>
				<input id="fournisseur" class="input" bind:value={fournisseur} placeholder="Ex. Point.P Bayonne" />
			</div>
			<div class="flex flex-col gap-1">
				<label for="date-tarif" class="text-sm font-semibold">Date du tarif</label>
				<input id="date-tarif" type="date" class="input" bind:value={dateTarif} />
			</div>
			<div class="flex flex-col gap-1 sm:col-span-2">
				<label for="fichier" class="text-sm font-semibold">Fichier (.xlsx ou .csv)</label>
				<input id="fichier" type="file" accept=".xlsx,.csv,.txt" class="input" on:change={choisirFichier} disabled={lecture || data.indisponible} />
				<p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">
					Ancien format Excel (.xls) : ouvrez-le puis « Enregistrer sous » .xlsx ou .csv.
				</p>
			</div>
		</div>

		{#if lecture}<p class="mt-4 text-sm">Lecture du fichier…</p>{/if}

		{#if colonnes && resultat}
			<h3 class="mb-2 mt-5 font-semibold">Colonnes reconnues</h3>
			<div class="grid gap-2 sm:grid-cols-2">
				{#each CHAMPS as champ}
					<label class="flex flex-col gap-1 text-sm">
						<span class="font-semibold">{champ.label}{champ.requis ? ' *' : ''}</span>
						<select class="input py-1.5" value={String(colonnes[champ.cle])} on:change={(e) => changerColonne(champ.cle, e.currentTarget.value)}>
							<option value="-1">— aucune —</option>
							{#each entetes as h, i}<option value={String(i)}>{h}</option>{/each}
						</select>
					</label>
				{/each}
				<label class="flex flex-col gap-1 text-sm">
					<span class="font-semibold">TVA par défaut (%)</span>
					<input type="number" min="0" max="100" step="0.1" class="input py-1.5" bind:value={tvaDefaut} />
				</label>
			</div>

			<h3 class="mb-2 mt-5 font-semibold">Aperçu</h3>
			<div class="overflow-x-auto">
				<table class="w-full text-xs">
					<thead>
						<tr class="border-b border-black/10 text-left uppercase text-ink-secondary dark:border-white/10 dark:text-ink-dark-secondary">
							<th class="py-1 pr-2">Réf.</th><th class="py-1 pr-2">Désignation</th><th class="py-1 pr-2">Unité</th><th class="py-1 pr-2 text-right">HT</th><th class="py-1 pr-2 text-right">TVA</th><th class="py-1 text-right">TTC</th>
						</tr>
					</thead>
					<tbody>
						{#each resultat.lignes.slice(0, 6) as l}
							<tr class="border-b border-black/5 dark:border-white/5">
								<td class="py-1 pr-2">{l.reference ?? '—'}</td>
								<td class="py-1 pr-2">{l.designation}</td>
								<td class="py-1 pr-2">{l.unite ?? '—'}</td>
								<td class="py-1 pr-2 text-right">{euros(l.prix_ht)}</td>
								<td class="py-1 pr-2 text-right">{l.tva} %</td>
								<td class="py-1 text-right">{euros(ttc(l.prix_ht, l.tva))}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="mt-3 text-sm">
				<strong>{resultat.lignes.length}</strong> article{resultat.lignes.length > 1 ? 's' : ''} prêt{resultat.lignes.length > 1 ? 's' : ''} à importer
				{#if resultat.erreurs.length}· <span class="text-warning">{resultat.erreurs.length} ligne{resultat.erreurs.length > 1 ? 's' : ''} ignorée{resultat.erreurs.length > 1 ? 's' : ''}</span>{/if}
			</p>
			{#if resultat.erreurs.length}
				<details class="mt-1 text-xs">
					<summary class="cursor-pointer">Voir les lignes ignorées</summary>
					<ul class="mt-1 list-inside list-disc">
						{#each resultat.erreurs.slice(0, 20) as e}<li>Ligne {e.ligne} : {e.raison}</li>{/each}
					</ul>
				</details>
			{/if}
			<button type="button" class="btn-primary mt-4" disabled={envoi || !fournisseur.trim() || resultat.lignes.length === 0 || colonnes.designation < 0} on:click={() => resultat && importer(resultat)}>
				{envoi ? 'Import en cours…' : 'Importer ce tarif'}
			</button>
		{/if}
	</section>

	<section class="flex flex-col gap-6">
		<div class="card p-6" aria-labelledby="mes-tarifs">
			<h2 id="mes-tarifs" class="mb-3 text-lg font-bold">Mes tarifs</h2>
			{#if data.tarifs.length === 0}
				<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Aucun tarif importé pour le moment.</p>
			{:else}
				<ul class="divide-y divide-black/5 dark:divide-white/10">
					{#each data.tarifs as t (t.id)}
						{@const age = ageJours(t.dateTarif ?? t.importeLe)}
						<li class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
							<div class="min-w-0">
								<p class="font-semibold">{t.fournisseur}</p>
								<p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">
									{t.lignes} articles · tarif du {dateFr(t.dateTarif ?? t.importeLe)}{t.fichier ? ` · ${t.fichier}` : ''}
								</p>
								{#if age > AGE_MAX_JOURS}
									<p class="mt-1 text-xs font-semibold text-warning">Tarif de plus de 3 mois : pensez à importer la nouvelle version.</p>
								{/if}
							</div>
							<button type="button" class="btn-secondary px-3 py-1 text-sm" on:click={() => supprimer(t.id, t.fournisseur)}>Supprimer</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="card p-6" aria-labelledby="recherche-tarif">
			<h2 id="recherche-tarif" class="mb-3 text-lg font-bold">Chercher un article</h2>
			<label for="q-tarif" class="sr-only">Désignation ou référence</label>
			<input id="q-tarif" class="input w-full" placeholder="Ex. colle, joint, BA13…" bind:value={q} on:input={chercher} />
			{#if trouve.length}
				<ul class="mt-3 divide-y divide-black/5 text-sm dark:divide-white/10">
					{#each trouve as l (l.id)}
						<li class="flex flex-wrap justify-between gap-2 py-2">
							<span class="min-w-0">
								{l.designation}
								<span class="block text-xs text-ink-secondary dark:text-ink-dark-secondary">{l.tarifs?.fournisseur ?? ''}{l.reference ? ` · réf. ${l.reference}` : ''}{l.unite ? ` · ${l.unite}` : ''}</span>
							</span>
							<span class="text-right">
								<strong>{euros(Number(l.prix_ht))} HT</strong>
								<span class="block text-xs text-ink-secondary dark:text-ink-dark-secondary">{euros(ttc(Number(l.prix_ht), Number(l.tva)))} TTC ({Number(l.tva)} %)</span>
							</span>
						</li>
					{/each}
				</ul>
			{:else if q.trim().length >= 2}
				<p class="mt-3 text-sm text-ink-secondary dark:text-ink-dark-secondary">Aucun article trouvé.</p>
			{/if}
		</div>
	</section>
</div>
