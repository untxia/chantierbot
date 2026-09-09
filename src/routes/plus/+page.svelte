<script lang="ts">
	import NavIcon from '$lib/components/NavIcon.svelte';
</script>

<svelte:head>
	<title>ChantierBot — Plus</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold">Plus</h1>

<ul class="flex flex-col gap-2">
	<li>
		<a href="/analyses" class="card flex items-center gap-3 hover:border-primary/40">
			<NavIcon icon="chart" />
			<span class="font-semibold">Analyses</span>
		</a>
	</li>
	<li>
		<a href="/parametres" class="card flex items-center gap-3 hover:border-primary/40">
			<NavIcon icon="settings" />
			<span class="font-semibold">Paramètres</span>
		</a>
	</li>
</ul>
