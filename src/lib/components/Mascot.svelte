<script lang="ts">
	import RobotBot from './RobotBot.svelte';
	export let state: 'idle' | 'working' | 'success' | 'error' = 'idle';
</script>

<div class="relative inline-flex h-10 w-10 shrink-0 items-center justify-center" role="img" aria-label={state === 'working' ? 'Analyse en cours' : state === 'success' ? 'Analyse terminée' : state === 'error' ? "Échec de l'analyse" : 'ChantierBot'}>
	<RobotBot variant="head" size={40} animate={true} state={state === 'working' ? 'working' : 'idle'} />

	{#if state === 'success'}
		<span class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] font-bold text-white">✓</span>
	{:else if state === 'error'}
		<span class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">!</span>
	{/if}
</div>

<style>
	@keyframes mascot-bob {
		0%,
		100% {
			transform: translateY(0) rotate(-2deg);
		}
		50% {
			transform: translateY(-3px) rotate(2deg);
		}
	}
	:global(.animate-mascot-bob) {
		animation: mascot-bob 700ms ease-in-out infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.animate-mascot-bob) {
			animation: none;
		}
	}
</style>
