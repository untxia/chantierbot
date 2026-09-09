<script lang="ts">
	export let state: 'idle' | 'working' | 'success' | 'error' = 'idle';
</script>

<div class="relative inline-flex h-10 w-10 shrink-0 items-center justify-center" role="img" aria-label={state === 'working' ? 'Analyse en cours' : state === 'success' ? 'Analyse terminée' : state === 'error' ? "Échec de l'analyse" : 'ChantierBot'}>
	<svg viewBox="0 0 40 40" class="h-10 w-10 {state === 'working' ? 'animate-mascot-bob' : ''}">
		<defs>
			<linearGradient id="mascot-gradient" x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
				<stop offset="0" stop-color="#5865F2" />
				<stop offset="1" stop-color="#8B5CF6" />
			</linearGradient>
		</defs>
		<!-- corps -->
		<rect x="13" y="20" width="14" height="14" rx="5" fill="url(#mascot-gradient)" />
		<!-- tête -->
		<circle cx="20" cy="14" r="8" fill="url(#mascot-gradient)" />
		<!-- casque -->
		<path d="M11 13a9 9 0 0 1 18 0v1H11z" fill="#F7F8FC" />
		<rect x="10.5" y="13.5" width="19" height="2.4" rx="1.2" fill="#F7F8FC" />
	</svg>

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
