<script lang="ts">
	// Fond héro stylisé (dégradé + silhouette de chantier) : pas de photo réelle utilisée, pour rester libre de droits.
</script>

<svg
	class="pointer-events-none absolute inset-0 h-full w-full"
	viewBox="0 0 1200 500"
	preserveAspectRatio="xMidYMax slice"
	aria-hidden="true"
>
	<defs>
		<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#0B1020" />
			<stop offset="0.55" stop-color="#171B37" />
			<stop offset="1" stop-color="#2A2350" />
		</linearGradient>
		<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#8B5CF6" stop-opacity="0.55" />
			<stop offset="1" stop-color="#5865F2" stop-opacity="0" />
		</linearGradient>
	</defs>

	<rect width="1200" height="500" fill="url(#sky)" />
	<circle cx="980" cy="230" r="220" fill="url(#sun)" />

	<!-- silhouette d'immeubles -->
	<g fill="#080C18" opacity="0.9">
		<rect x="0" y="330" width="70" height="170" />
		<rect x="80" y="290" width="55" height="210" />
		<rect x="145" y="360" width="90" height="140" />
		<rect x="245" y="250" width="60" height="250" />
		<rect x="315" y="320" width="80" height="180" />
		<rect x="860" y="300" width="70" height="200" />
		<rect x="940" y="340" width="90" height="160" />
		<rect x="1040" y="270" width="60" height="230" />
		<rect x="1110" y="330" width="90" height="170" />
	</g>

	<!-- grue -->
	<g stroke="#F7F8FC" stroke-width="4" stroke-linecap="round" opacity="0.85">
		<line x1="620" y1="500" x2="620" y2="150" />
		<line x1="620" y1="160" x2="760" y2="160" />
		<line x1="620" y1="160" x2="560" y2="200" />
		<line x1="700" y1="160" x2="700" y2="230" />
	</g>
</svg>
