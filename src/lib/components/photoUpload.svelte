<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { uploadPhoto, photoSignedUrl } from '$lib/services/supabase';
	import { toast } from '$lib/stores/toast';
	import Mascot from './Mascot.svelte';
	export let chantierId: string;
	let loading = false;
	let mascotState: 'idle' | 'working' | 'success' | 'error' = 'idle';
	let statusMessage = '';
	let draftSaved = false;
	let latest: { imageUrl: string; trade: string; description: string; detectedWorks: string[]; quantities: { item: string; quantity: number; unit: string }[]; estimate: { title: string; trade: string; lines: { description: string; quantity: number; unit: string; unitPrice: number; total: number; type: 'material' | 'labor' }[]; totalMaterials: number; totalLabor: number; total: number; confidence: string; notes: string[] } } | null = null;

	function getTradeId() {
		if (typeof window === 'undefined') return 'general';
		return window.localStorage.getItem('chantierbot-background') || 'general';
	}

	function saveDraft() {
		if (!latest || typeof window === 'undefined') return;
		window.localStorage.setItem('chantierbot-draft-quote', JSON.stringify({ chantierId, createdAt: new Date().toISOString(), ...latest }));
		draftSaved = true;
		toast.success('Brouillon de devis enregistré.');
	}

	async function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		loading = true;
		latest = null;
		draftSaved = false;
		mascotState = 'working';
		statusMessage = '📸 Envoi → 🤖 analyse métier → 📐 quantités → 💰 estimation...';
		try {
			const extension = file.name.split('.').pop() || 'jpg';
			const path = await uploadPhoto(chantierId, file, extension);
			const imageUrl = await photoSignedUrl(path);
			const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chantierId, imagePath: path, imageUrl, tradeId: getTradeId() }) });
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Erreur serveur');
			latest = { imageUrl, ...body.analysis };
			mascotState = 'success';
			statusMessage = 'Analyse et estimation terminées. Vous pouvez créer un brouillon de devis.';
			toast.success('Photo analysée et estimation générée.');
			await invalidateAll();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erreur inconnue';
			mascotState = 'error';
			statusMessage = `Échec de l'analyse : ${message}`;
			toast.error(message);
		} finally {
			loading = false;
			input.value = '';
			setTimeout(() => (mascotState = 'idle'), 2000);
		}
	}
</script>

<div class="mb-8 flex flex-col gap-2">
	<label for="photo-input" class="font-semibold">Ajouter une photo de chantier <span class="badge-ai ml-1 align-middle">✨ IA</span></label>
	<div class="flex items-center gap-3"><Mascot state={mascotState} /><input id="photo-input" type="file" accept="image/*" on:change={handleFileChange} disabled={loading} aria-busy={loading} class="input flex-1 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-white disabled:opacity-50" /></div>
	<p class="min-h-[1.2em] text-sm text-ink-secondary dark:text-ink-dark-secondary" aria-live="polite">{statusMessage}</p>
</div>

{#if latest}
	<section class="mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-secondary/[0.08] p-5 shadow-card" aria-label="Résultat de l'analyse IA">
		<div class="flex flex-col gap-5 lg:flex-row">
			<img src={latest.imageUrl} alt="Photo analysée" class="h-48 w-full rounded-xl object-cover lg:w-64" />
			<div class="min-w-0 flex-1"><div class="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">Copilote IA · {latest.estimate.trade}</p><h2 class="text-xl font-extrabold">{latest.estimate.title}</h2></div><span class="rounded-full bg-white/80 px-3 py-1 text-xs font-bold dark:bg-surface-dark">Confiance : {latest.estimate.confidence}</span></div><p class="text-sm leading-relaxed text-ink-secondary dark:text-ink-dark-secondary">{latest.description}</p>
			{#if latest.detectedWorks.length}<div class="mt-3"><p class="text-sm font-bold">Travaux détectés</p><div class="mt-1 flex flex-wrap gap-2">{#each latest.detectedWorks as work}<span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{work}</span>{/each}</div></div>{/if}
			{#if latest.quantities.length}<div class="mt-3"><p class="text-sm font-bold">Quantités estimées</p><div class="mt-1 flex flex-wrap gap-2">{#each latest.quantities as q}<span class="rounded-lg border border-black/5 bg-white/70 px-2.5 py-1 text-xs dark:border-white/10 dark:bg-surface-dark/70">{q.item} · <strong>{q.quantity} {q.unit}</strong></span>{/each}</div></div>{/if}</div>
		</div>
		<div class="mt-5 overflow-x-auto rounded-xl border border-black/5 bg-white/80 dark:border-white/10 dark:bg-surface-dark/80"><table class="w-full min-w-[600px] text-sm"><thead><tr class="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink-secondary dark:border-white/10 dark:text-ink-dark-secondary"><th class="px-4 py-3">Poste</th><th class="px-4 py-3">Qté</th><th class="px-4 py-3">PU HT</th><th class="px-4 py-3 text-right">Total HT</th></tr></thead><tbody>{#each latest.estimate.lines as line}<tr class="border-b border-black/5 last:border-0 dark:border-white/10"><td class="px-4 py-2.5"><span class="mr-2 rounded-full px-2 py-0.5 text-[10px] font-bold {line.type === 'labor' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}">{line.type === 'labor' ? 'MO' : 'MAT'}</span>{line.description}</td><td class="px-4 py-2.5">{line.quantity} {line.unit}</td><td class="px-4 py-2.5">{line.unitPrice.toFixed(2)} €</td><td class="px-4 py-2.5 text-right font-semibold">{line.total.toFixed(2)} €</td></tr>{/each}</tbody></table></div>
		<div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-white/70 p-3 dark:bg-surface-dark/70"><p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">Matériaux</p><p class="font-extrabold">{latest.estimate.totalMaterials.toFixed(2)} €</p></div><div class="rounded-xl bg-white/70 p-3 dark:bg-surface-dark/70"><p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">Main-d'œuvre</p><p class="font-extrabold">{latest.estimate.totalLabor.toFixed(2)} €</p></div><div class="rounded-xl bg-primary p-3 text-white"><p class="text-xs text-white/70">Total estimatif HT</p><p class="text-xl font-extrabold">{latest.estimate.total.toFixed(2)} €</p></div></div>
		<div class="mt-5 flex flex-wrap gap-3"><button type="button" on:click={saveDraft} class="btn-primary">📝 {draftSaved ? 'Brouillon enregistré' : 'Créer le brouillon de devis'}</button><a href="/rapports" class="btn-secondary">Ouvrir le devis →</a></div>
		{#if latest.estimate.notes.length}<ul class="mt-4 space-y-1 text-xs text-ink-secondary dark:text-ink-dark-secondary">{#each latest.estimate.notes as note}<li>• {note}</li>{/each}</ul>{/if}
		<p class="mt-4 text-[11px] text-ink-secondary dark:text-ink-dark-secondary">⚠️ Estimation IA indicative : dimensions, quantités, prix fournisseurs, taux de main-d'œuvre et contraintes techniques à vérifier avant tout devis client.</p>
	</section>
{/if}
