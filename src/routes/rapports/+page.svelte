<script lang="ts">
	import { onMount } from 'svelte';
	let draft: any = null;
	onMount(() => {
		try { draft = JSON.parse(window.localStorage.getItem('chantierbot-draft-quote') || 'null'); } catch { draft = null; }
	});
	function money(value: number) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0); }
	function printQuote() { window.print(); }
	function clearDraft() { window.localStorage.removeItem('chantierbot-draft-quote'); draft = null; }
</script>

<svelte:head><title>ChantierBot — Devis IA</title></svelte:head>

<div class="mb-6 flex flex-wrap items-end justify-between gap-3 print:hidden"><div><p class="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Production</p><h1 class="text-2xl font-extrabold">Devis IA</h1><p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Transformez l'analyse photo en brouillon de devis vérifiable.</p></div>{#if draft}<div class="flex gap-2"><button type="button" class="btn-secondary" on:click={clearDraft}>Effacer</button><button type="button" class="btn-primary" on:click={printQuote}>🖨️ Imprimer / PDF</button></div>{/if}</div>

{#if !draft}
	<div class="card print:hidden"><div class="mb-3 text-4xl">📸 → 🤖 → 📝</div><h2 class="text-lg font-bold">Aucun brouillon pour le moment</h2><p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Ajoutez une photo depuis un chantier. ChantierBot analysera le métier, les travaux, les quantités et produira une estimation indicative.</p><a href="/projets" class="btn-primary mt-4 inline-flex">Aller aux chantiers →</a></div>
{:else}
	<article class="mx-auto max-w-4xl rounded-2xl border border-black/5 bg-white p-8 shadow-card dark:border-white/10 dark:bg-surface-dark print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
		<div class="flex flex-wrap justify-between gap-6 border-b border-black/10 pb-6 dark:border-white/10"><div><p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">CHANTIERBOT · BROUILLON</p><h2 class="mt-1 text-3xl font-extrabold">{draft.estimate?.title || 'Estimation de travaux'}</h2><p class="mt-2 text-sm text-ink-secondary dark:text-ink-dark-secondary">Métier : <strong>{draft.estimate?.trade}</strong> · Généré le {new Date(draft.createdAt).toLocaleDateString('fr-FR')}</p></div><div class="text-right"><p class="text-xs uppercase tracking-wide text-ink-secondary dark:text-ink-dark-secondary">Total HT</p><p class="text-3xl font-black text-primary">{money(draft.estimate?.total)}</p><p class="mt-1 text-xs">Confiance IA : {draft.estimate?.confidence}</p></div></div>
		{#if draft.description}<section class="py-6"><h3 class="mb-2 font-bold">Analyse du chantier</h3><p class="text-sm leading-relaxed text-ink-secondary dark:text-ink-dark-secondary">{draft.description}</p></section>{/if}
		{#if draft.detectedWorks?.length}<section class="pb-6"><h3 class="mb-2 font-bold">Travaux identifiés</h3><ul class="grid gap-2 sm:grid-cols-2">{#each draft.detectedWorks as work}<li class="rounded-lg bg-primary/5 px-3 py-2 text-sm">✓ {work}</li>{/each}</ul></section>{/if}
		<section><h3 class="mb-3 font-bold">Détail estimatif</h3><div class="overflow-hidden rounded-xl border border-black/10 dark:border-white/10"><table class="w-full text-sm"><thead><tr class="border-b border-black/10 bg-black/[0.02] text-left text-xs uppercase dark:border-white/10 dark:bg-white/[0.02]"><th class="px-4 py-3">Désignation</th><th class="px-4 py-3">Qté</th><th class="px-4 py-3">PU HT</th><th class="px-4 py-3 text-right">Total HT</th></tr></thead><tbody>{#each draft.estimate?.lines || [] as line}<tr class="border-b border-black/5 last:border-0 dark:border-white/10"><td class="px-4 py-3"><span class="mr-2 text-[10px] font-bold text-primary">{line.type === 'labor' ? 'MO' : 'MAT'}</span>{line.description}</td><td class="px-4 py-3">{line.quantity} {line.unit}</td><td class="px-4 py-3">{money(line.unitPrice)}</td><td class="px-4 py-3 text-right font-semibold">{money(line.total)}</td></tr>{/each}</tbody></table></div></section>
		<div class="mt-6 ml-auto max-w-sm space-y-2 border-t border-black/10 pt-4 text-sm dark:border-white/10"><div class="flex justify-between"><span>Matériaux</span><strong>{money(draft.estimate?.totalMaterials)}</strong></div><div class="flex justify-between"><span>Main-d'œuvre</span><strong>{money(draft.estimate?.totalLabor)}</strong></div><div class="flex justify-between border-t pt-2 text-lg dark:border-white/10"><span class="font-bold">Total HT</span><strong class="text-primary">{money(draft.estimate?.total)}</strong></div></div>
		<div class="mt-8 rounded-xl bg-amber-500/10 p-4 text-xs leading-relaxed print:bg-transparent print:p-0"><strong>Important :</strong> ce document est un brouillon généré par IA. Les dimensions, quantités, prix fournisseurs, taux de main-d'œuvre, TVA et contraintes techniques doivent être contrôlés par l'artisan avant transmission au client.</div>
	</article>
{/if}
