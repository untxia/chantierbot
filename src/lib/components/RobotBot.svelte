<script lang="ts">
	/**
	 * Le robot ChantierBot, en SVG inline (dégradés dans IconDefs.svelte).
	 * Mouvements simples : flottement, clignement, salut de la main, halo de l'oreille.
	 */
	export let variant: 'full' | 'head' = 'full';
	export let animate = true;
	export let state: 'idle' | 'working' = 'idle';
	/** Largeur affichée, en px. */
	export let size = 96;

	$: head = variant === 'head';
	$: viewBox = head ? '28 28 512 476' : '0 0 560 680';
	$: height = Math.round(size * (head ? 476 / 512 : 680 / 560));
</script>

<svg
	{viewBox}
	width={size}
	{height}
	class="rb"
	class:rb-animate={animate}
	class:rb-working={animate && state === 'working'}
	role="img"
	aria-label="ChantierBot"
	fill="none"
>
	{#if !head}
		<ellipse class="rb-glow" cx="285" cy="638" rx="205" ry="32" fill="#4AB9FF" opacity=".2" filter="url(#rb-softGlow)" />
	{/if}

	<!-- casque -->
	<g class="rb-head">
		<path d="M126 188c0-94 70-145 157-145 91 0 154 56 154 148v30H126v-33Z" fill="url(#rb-helmet)" />
		<path d="M128 177c55-22 235-27 308 0v45c-51 25-251 25-308 0v-45Z" fill="url(#rb-helmetSide)" />
		<path d="M148 166c22-55 75-94 135-101 67-8 125 26 151 80" stroke="#FFF5BA" stroke-width="13" stroke-linecap="round" opacity=".48" />
		<path d="M276 43h28v55h-28z" fill="#F4A821" />
		<path d="M289 57c-10 13-14 25-13 39" stroke="#FFF5B4" stroke-width="7" stroke-linecap="round" opacity=".65" />
		<path d="M284 119 316 94l32 25v34h-64v-34Z" fill="#263A51" />
		<path d="M297 137h13v16h-13zM313 128h14v25h-14z" fill="#FFC340" />

		<!-- coque chromée -->
		<rect x="69" y="168" width="430" height="292" rx="116" fill="url(#rb-chrome)" />
		<path d="M102 204c33-30 84-43 183-43 100 0 157 17 184 48" stroke="#fff" stroke-width="11" opacity=".62" stroke-linecap="round" />
		<path d="M87 354c48 66 333 96 410 6" stroke="#516378" stroke-width="28" opacity=".2" />

		<!-- visière -->
		<rect x="98" y="196" width="372" height="231" rx="91" fill="url(#rb-visor)" />
		<path d="M124 230c63-46 224-56 320-7" stroke="url(#rb-reflection)" stroke-width="17" stroke-linecap="round" opacity=".5" />
		<path d="M132 389c67 38 224 49 304-1" stroke="#000" stroke-width="22" opacity=".2" stroke-linecap="round" />

		<!-- yeux (clignent) -->
		<g class="rb-eyes">
			<path d="M164 302c6-37 62-37 68 0" stroke="#75D7FF" stroke-width="16" stroke-linecap="round" filter="url(#rb-blueGlow)" />
			<path d="M330 302c6-37 62-37 68 0" stroke="#75D7FF" stroke-width="16" stroke-linecap="round" filter="url(#rb-blueGlow)" />
			<path d="M170 298c8-19 42-22 55-5" stroke="#E5FBFF" stroke-width="5" stroke-linecap="round" />
			<path d="M336 298c8-19 42-22 55-5" stroke="#E5FBFF" stroke-width="5" stroke-linecap="round" />
		</g>
		<path d="M252 348c22 24 49 24 72 0" stroke="#73D9FF" stroke-width="10" stroke-linecap="round" filter="url(#rb-blueGlow)" />

		<!-- oreilles -->
		<ellipse cx="78" cy="308" rx="43" ry="51" fill="#8B9CAF" />
		<ellipse cx="78" cy="308" rx="27" ry="34" fill="#24384F" />
		<ellipse class="rb-ear-light" cx="78" cy="308" rx="10" ry="14" fill="url(#rb-eye)" filter="url(#rb-blueGlow)" />
		<ellipse cx="490" cy="308" rx="43" ry="51" fill="#66788D" />
		<ellipse cx="490" cy="308" rx="27" ry="34" fill="#1A2D43" />
		<ellipse cx="490" cy="308" rx="9" ry="13" fill="#49657F" />

		<path d="M112 221c13-22 35-36 61-43" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".5" />
		<path d="M112 368c18 35 48 50 82 58" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".2" />
	</g>

	{#if !head}
		<!-- cou et buste -->
		<path d="M214 431h132l-11 65H225l-11-65Z" fill="#0C1A2B" />
		<ellipse cx="280" cy="431" rx="68" ry="17" fill="#51657C" />
		<path d="M144 461c35-34 236-34 273 0 43 40 68 111 74 169H69c7-62 33-133 75-169Z" fill="url(#rb-suit)" />
		<path d="M173 475c42-23 176-23 217 0l30 155H141l32-155Z" fill="url(#rb-chest)" opacity=".86" />
		<path d="M191 479h178l15 151H176l15-151Z" fill="#1C314A" opacity=".74" />
		<path d="M210 493c37-13 104-13 140 0v114H210V493Z" fill="#334B66" />

		<!-- badge CB -->
		<rect x="241" y="514" width="78" height="78" rx="19" fill="#F8FBFF" opacity=".98" />
		<rect x="251" y="524" width="58" height="58" rx="15" fill="url(#rb-helmet)" />
		<text x="280" y="565" text-anchor="middle" font-family="'Barlow Condensed', Arial, sans-serif" font-size="34" font-weight="800" fill="#263A51">CB</text>
		<path d="M260 535h37" stroke="#FFF4A4" stroke-width="5" stroke-linecap="round" opacity=".65" />

		<!-- bras droit -->
		<path d="M410 479c67 16 93 74 79 128-9 34-37 51-66 37-29-14-37-48-23-80l-32-44 42-41Z" fill="url(#rb-chest)" />
		<path d="M432 502c30 17 45 49 37 79" stroke="#fff" stroke-width="10" opacity=".25" stroke-linecap="round" />

		<!-- bras gauche + main (salue) -->
		<g class="rb-arm">
			<path d="M151 477c-61 14-98 65-80 119 12 36 49 54 80 35 30-18 37-49 20-81l43-42-63-31Z" fill="url(#rb-chest)" />
			<path d="M111 495c-18 15-28 40-21 66" stroke="#fff" stroke-width="11" opacity=".32" stroke-linecap="round" />
			<path d="M72 474c-18-24-18-55 1-79 14-17 39-14 51 3 9 14 8 31 1 47l21 17-31 37-43-25Z" fill="#26394F" />
			<path d="M83 421c-7-32 8-61 31-65 22-4 35 17 28 39l-11 39-48-13Z" fill="#31465E" />
			<path d="M92 413c-2-17 6-35 19-44 12-8 26-1 29 12 3 12-3 22-10 30l-9 13-29-11Z" fill="#3D536C" />
			<path d="M71 480c-7 23 2 44 23 53" stroke="#F8FCFF" stroke-width="9" opacity=".78" stroke-linecap="round" />
		</g>

		<!-- bottes -->
		<path d="M150 606h111v55H128c-23 0-35-19-25-39 8-12 24-16 47-16Z" fill="#13263C" />
		<path d="M299 606h111c22 0 38 8 45 23 8 19-5 32-28 32H299v-55Z" fill="#13263C" />
		<path d="M180 493c18-9 39-14 61-17" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".35" />
	{/if}
</svg>

<style>
	.rb {
		display: inline-block;
		flex-shrink: 0;
		overflow: visible;
		/* Ombre portée : donne le relief « 3D » sans filtre SVG animé. */
		filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.35));
	}

	.rb-animate {
		animation: rb-float 3.6s ease-in-out infinite;
	}
	.rb-animate.rb-working {
		animation-duration: 0.9s;
	}

	.rb-animate .rb-eyes {
		transform-box: fill-box;
		transform-origin: center;
		animation: rb-blink 4.5s ease-in-out infinite;
	}

	.rb-animate .rb-head {
		transform-box: view-box;
		transform-origin: 284px 440px;
		animation: rb-tilt 5.4s ease-in-out infinite;
	}

	.rb-animate .rb-arm {
		transform-box: view-box;
		transform-origin: 150px 480px;
		animation: rb-wave 3.2s ease-in-out infinite;
	}

	.rb-animate .rb-ear-light {
		animation: rb-pulse 2.2s ease-in-out infinite;
	}

	@keyframes rb-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}

	@keyframes rb-blink {
		0%,
		90%,
		100% {
			transform: scaleY(1);
		}
		94% {
			transform: scaleY(0.12);
		}
	}

	@keyframes rb-tilt {
		0%,
		100% {
			transform: rotate(0deg);
		}
		30% {
			transform: rotate(-2.2deg);
		}
		70% {
			transform: rotate(2deg);
		}
	}

	@keyframes rb-wave {
		0%,
		60%,
		100% {
			transform: rotate(0deg);
		}
		72% {
			transform: rotate(-9deg);
		}
		84% {
			transform: rotate(5deg);
		}
		92% {
			transform: rotate(-6deg);
		}
	}

	@keyframes rb-pulse {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rb-animate,
		.rb-animate .rb-eyes,
		.rb-animate .rb-head,
		.rb-animate .rb-arm,
		.rb-animate .rb-ear-light {
			animation: none;
		}
	}
</style>
