<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { photoPublicUrl } from '$lib/services/supabase';
	import HeroBackground from '$lib/components/HeroBackground.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	import type { PageData } from './$types';

	export let data: PageData;

	let prompt = '';

	function submitPrompt() {
		if (!prompt.trim()) return;
		toast.info('Assistant conversationnel bientôt disponible — en attendant, direction Chantiers ou Analyses.');
		prompt = '';
	}

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
	<title>ChantierBot — Tableau de bord</title>
</svelte:head>

<section class="relative overflow-hidden bg-dark-navy text-white">
	<HeroBackground />

	<div class="relative mx-auto max-w-6xl px-4 pt-28 pb-12 sm:px-8 sm:pt-32">
		<h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting} 👋</h1>
		<p class="mt-1 text-lg text-white/80">
			{data.recommendations.length > 0
				? `${data.recommendations.length} recommandation${data.recommendations.length > 1 ? 's' : ''} IA à consulter.`
				: 'Tout est à jour, aucune recommandation en attente.'}
		</p>
		<p class="mt-2 max-w-xl text-sm text-white/60">
			ChantierBot analyse vos photos et votre stock pour vous faire gagner du temps.
		</p>

		<form on:submit|preventDefault={submitPrompt} class="mt-6 flex max-w-2xl items-center gap-3 rounded-full bg-white/10 p-2 pl-3 backdrop-blur-md">
			<span class="ai-orb">✨</span>
			<input
				type="text"
				bind:value={prompt}
				placeholder="Posez une question ou décrivez un besoin..."
				class="flex-1 border-0 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
			/>
			<button type="submit" class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-white" aria-label="Envoyer">
				➤
			</button>
		</form>

		<div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="card-glass">
				<p class="text-2xl">🧱</p>
				<p class="mt-1 text-2xl font-extrabold">{data.kpis.activeCount}</p>
				<p class="text-xs text-white/60">Chantiers actifs</p>
			</div>
			<div class="card-glass">
				<p class="text-2xl">✨</p>
				<p class="mt-1 text-2xl font-extrabold">{data.recommendations.length}</p>
				<p class="text-xs text-white/60">Recommandations IA</p>
			</div>
			<div class="card-glass">
				<p class="text-2xl">📷</p>
				<p class="mt-1 text-2xl font-extrabold">{data.kpis.photoCount}</p>
				<p class="text-xs text-white/60">Photos analysées</p>
			</div>
			<div class="card-glass">
				<p class="text-2xl">🕒</p>
				<p class="mt-1 text-lg font-bold">{formatRelative(data.kpis.lastActivity)}</p>
				<p class="text-xs text-white/60">Dernière activité</p>
			</div>
		</div>
	</div>
</section>

<div class="mx-auto max-w-6xl px-4 py-10 sm:px-8">
	{#if data.recommendations.length > 0}
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold">✨ Recommandations IA</h2>
			<a href="/ia" class="text-sm font-medium text-primary hover:underline">Voir tout →</a>
		</div>
		<div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each data.recommendations as reco (reco.id)}
				<article class="card">
					<img src={photoPublicUrl(reco.imagePath)} alt="" class="mb-3 h-32 w-full rounded-md object-cover" />
					{#if reco.chantier}
						<p class="text-xs font-semibold text-primary">{reco.chantier.name}</p>
					{/if}
					<p class="font-semibold">{reco.issue}</p>
					<p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary line-clamp-2">{reco.description}</p>
					{#if reco.chantier}
						<a href="/chantiers/{reco.chantier.id}" class="btn-secondary mt-3 w-full">Voir le chantier</a>
					{/if}
				</article>
			{/each}
		</div>
	{/if}

	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold">Vos chantiers</h2>
		<a href="/projets" class="text-sm font-medium text-primary hover:underline">Voir tout →</a>
	</div>

	{#if data.recentChantiers.length === 0}
		<p class="text-ink-secondary dark:text-ink-dark-secondary">
			Aucun chantier pour le moment. <a href="/projets" class="text-primary hover:underline">Créez le premier.</a>
		</p>
	{:else}
		<ul class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
			{#each data.recentChantiers as chantier (chantier.id)}
				<li>
					<a href="/chantiers/{chantier.id}" class="card block hover:border-primary/40 dark:hover:border-primary/40">
						<div class="mb-2 flex items-start justify-between gap-2">
							<h3 class="font-semibold">{chantier.name}</h3>
							<StatusBadge status={chantier.status} />
						</div>
						<div class="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
							<div class="h-full rounded-full bg-brand-gradient" style="width: {chantier.progress}%"></div>
						</div>
						<p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">
							{chantier.progress}% · {chantier.photoCount} photo{chantier.photoCount > 1 ? 's' : ''}
						</p>
					</a>
				</li>
			{/each}
			<li>
				<a
					href="/projets"
					class="flex h-full min-h-[100px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/15 text-ink-secondary hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-ink-dark-secondary"
				>
					<span class="text-xl">+</span>
					<span class="text-sm font-medium">Nouveau chantier</span>
				</a>
			</li>
		</ul>
	{/if}
</div>
