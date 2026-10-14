<script lang="ts">
	import RobotBot from './RobotBot.svelte';

	/** « dark » = logo posé sur un fond sombre (texte clair) ; « light » = sur fond clair. */
	export let tone: 'dark' | 'light' = 'dark';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let tagline = false;
	export let animate = true;

	const dims = {
		sm: { robot: 40, font: 24, tag: 10 },
		md: { robot: 56, font: 32, tag: 12 },
		lg: { robot: 84, font: 48, tag: 14 }
	};
	$: d = dims[size];
</script>

<span class="logo logo-{tone}" role="img" aria-label="ChantierBot — Votre allié sur tous vos chantiers">
	<RobotBot variant="head" size={d.robot} {animate} />
	<span class="stack" aria-hidden="true">
		<span class="word" style="font-size: {d.font}px"><span class="a">Chantier</span><span class="b">Bot</span></span>
		{#if tagline}<span class="tag" style="font-size: {d.tag}px">Votre allié sur tous vos chantiers</span>{/if}
	</span>
</span>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		line-height: 1;
		white-space: nowrap;
	}

	.stack {
		display: inline-flex;
		flex-direction: column;
		gap: 4px;
	}

	.word {
		font-family: 'Barlow Condensed', 'Barlow', system-ui, sans-serif;
		font-weight: 800;
		letter-spacing: 0.01em;
		line-height: 1;
	}

	/* Relief : extrusion en couches + ombre portée. */
	.logo-dark .a {
		color: #ffffff;
		text-shadow:
			0 1px 0 #d9e2f1,
			0 2px 0 #b3c0d6,
			0 3px 0 #8b99b3,
			0 4px 0 #6a7894,
			0 9px 14px rgba(0, 0, 0, 0.5);
	}
	.logo-light .a {
		color: #1b2438;
		text-shadow:
			0 1px 0 #3a4560,
			0 2px 0 #566179,
			0 3px 0 #8791a8,
			0 8px 12px rgba(27, 36, 56, 0.28);
	}
	.b {
		color: #ffb020;
		text-shadow:
			0 1px 0 #f0a010,
			0 2px 0 #d68a05,
			0 3px 0 #b87000,
			0 4px 0 #8f5600,
			0 9px 14px rgba(0, 0, 0, 0.4);
	}

	.tag {
		font-family: 'Barlow', system-ui, sans-serif;
		font-weight: 500;
		letter-spacing: 0.02em;
	}
	.logo-dark .tag {
		color: rgba(235, 242, 255, 0.82);
	}
	.logo-light .tag {
		color: #5b6784;
	}
</style>
