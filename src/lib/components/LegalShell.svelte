<script lang="ts">
	import Logo from './Logo.svelte';
	import { LEGAL, missingLegalFields } from '$lib/config/legal';

	export let title: string;

	const missing = missingLegalFields();
</script>

<div class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
	<header class="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
		<a href="/" aria-label="Retour à l’accueil">
			<span class="dark:hidden"><Logo tone="light" size="sm" animate={false} /></span>
			<span class="hidden dark:inline"><Logo tone="dark" size="sm" animate={false} /></span>
		</a>
		<nav aria-label="Documents légaux" class="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
			<a href="/mentions-legales" class="hover:underline">Mentions légales</a>
			<a href="/confidentialite" class="hover:underline">Confidentialité</a>
			<a href="/conditions" class="hover:underline">Conditions d’utilisation</a>
		</nav>
	</header>

	{#if missing.length > 0}
		<p class="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm print:hidden" role="note">
			<strong>Document en cours de finalisation.</strong> Les informations suivantes de l’éditeur restent à compléter :
			{missing.join(', ')}.
		</p>
	{/if}

	<article class="legal-doc card">
		<h1>{title}</h1>
		<p class="legal-updated">Dernière mise à jour : {LEGAL.lastUpdated}</p>
		<slot />
	</article>

	<p class="mt-6 text-center text-xs text-ink-secondary dark:text-ink-dark-secondary print:hidden">
		<a href="/" class="hover:underline">← Retour à {LEGAL.appName}</a>
	</p>
</div>

<style>
	/* Mise en forme du texte juridique (pas de plugin « typography » dans le projet). */
	.legal-doc :global(h1) {
		margin-bottom: 0.25rem;
	}
	.legal-doc :global(.legal-updated) {
		margin: 0 0 1.5rem;
		font-size: 0.85rem;
		opacity: 0.7;
	}
	.legal-doc :global(h2) {
		margin: 2rem 0 0.5rem;
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.2;
	}
	.legal-doc :global(p),
	.legal-doc :global(li) {
		font-size: 0.95rem;
		line-height: 1.65;
	}
	.legal-doc :global(p) {
		margin: 0.6rem 0;
	}
	.legal-doc :global(ul) {
		margin: 0.5rem 0 0.5rem 1.25rem;
		list-style: disc;
	}
	.legal-doc :global(a) {
		text-decoration: underline;
		color: rgb(88 101 242);
	}
	.legal-doc :global(table) {
		width: 100%;
		margin: 0.75rem 0;
		border-collapse: collapse;
		font-size: 0.88rem;
	}
	.legal-doc :global(th),
	.legal-doc :global(td) {
		padding: 0.5rem 0.6rem;
		text-align: left;
		vertical-align: top;
		border-bottom: 1px solid rgba(127, 127, 127, 0.25);
	}
	.legal-doc :global(.legal-todo) {
		padding: 0 0.25rem;
		border-radius: 4px;
		background: rgba(245, 158, 11, 0.25);
		color: inherit;
	}
	@media print {
		.legal-doc {
			border: 0;
			box-shadow: none;
			padding: 0;
		}
	}
</style>
