<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>ChantierBot — Activité IA</title>
</svelte:head>

<h1 class="mb-1 text-2xl font-bold">
	Activité IA <span class="badge-ai ml-1 align-middle">✨ IA</span>
</h1>
<p class="mb-6 text-ink-secondary dark:text-ink-dark-secondary">Dernières analyses de photos, tous chantiers confondus.</p>

{#if data.activity.length === 0}
	<p class="text-ink-secondary dark:text-ink-dark-secondary">Aucune analyse pour le moment.</p>
{:else}
	<ul class="flex flex-col gap-4">
		{#each data.activity as item (item.id)}
			<li class="card flex flex-col gap-3 sm:flex-row">
				<img src={item.imageUrl ?? ''} alt={item.description ?? ''} class="h-32 w-full rounded-md object-cover sm:w-40" />
				<div class="flex-1 text-sm">
					<div class="mb-1 flex items-center justify-between gap-2">
						{#if item.chantier}
							<a href="/chantiers/{item.chantier.id}" class="font-semibold text-primary hover:underline">{item.chantier.name}</a>
						{:else}
							<span class="font-semibold text-ink-secondary dark:text-ink-dark-secondary">Chantier supprimé</span>
						{/if}
						<span class="text-xs text-ink-secondary dark:text-ink-dark-secondary">{new Date(item.createdAt).toLocaleString('fr-FR')}</span>
					</div>
					{#if item.error}
						<p class="text-danger">{item.error}</p>
					{:else}
						<p>{item.description}</p>
						{#if item.issues.length}
							<p><strong>Problèmes :</strong> {item.issues.join(', ')}</p>
						{/if}
						{#if item.materials.length}
							<p><strong>Matériaux :</strong> {item.materials.join(', ')}</p>
						{/if}
						{#if item.progressEstimate}
							<p><strong>Avancement :</strong> {item.progressEstimate}</p>
						{/if}
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
