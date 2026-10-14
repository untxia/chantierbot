<script lang="ts">
	// Composant purement déclaratif.
</script>

<!-- Dégradés partagés par les icônes 3D (NavIcon). À monter une seule fois dans le layout. -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="g-blue" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#8FA0FF" /><stop offset="1" stop-color="#4350DC" />
		</linearGradient>
		<linearGradient id="g-violet" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#C4A0FF" /><stop offset="1" stop-color="#7A35E8" />
		</linearGradient>
		<linearGradient id="g-amber" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#FFD875" /><stop offset="1" stop-color="#FF9A12" />
		</linearGradient>
		<linearGradient id="g-amber-dark" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#F5A524" /><stop offset="1" stop-color="#C96F00" />
		</linearGradient>
		<linearGradient id="g-green" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#6EE79A" /><stop offset="1" stop-color="#16A34A" />
		</linearGradient>
		<linearGradient id="g-red" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#FF8F8F" /><stop offset="1" stop-color="#E02D2D" />
		</linearGradient>
		<linearGradient id="g-slate" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#DCE3EE" /><stop offset="1" stop-color="#7C8AA3" />
		</linearGradient>
		<linearGradient id="g-white" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#CBD3EA" />
		</linearGradient>

		<!-- Robot ChantierBot (RobotBot.svelte) -->
		<linearGradient id="rb-helmet" x1="110" y1="50" x2="420" y2="220" gradientUnits="userSpaceOnUse">
			<stop stop-color="#FFF4A5" /><stop offset=".22" stop-color="#FFD75A" /><stop offset=".58" stop-color="#FFB52D" /><stop offset="1" stop-color="#B96809" />
		</linearGradient>
		<linearGradient id="rb-helmetSide" x1="130" y1="120" x2="400" y2="190" gradientUnits="userSpaceOnUse">
			<stop stop-color="#F2A21E" /><stop offset=".55" stop-color="#C9780A" /><stop offset="1" stop-color="#8C4B06" />
		</linearGradient>
		<linearGradient id="rb-chrome" x1="95" y1="160" x2="470" y2="430" gradientUnits="userSpaceOnUse">
			<stop stop-color="#FFFFFF" /><stop offset=".18" stop-color="#EAF2FA" /><stop offset=".48" stop-color="#B9C7D7" /><stop offset=".76" stop-color="#74859A" /><stop offset="1" stop-color="#46566B" />
		</linearGradient>
		<radialGradient id="rb-visor" cx="48%" cy="8%" r="95%">
			<stop stop-color="#28517A" /><stop offset=".28" stop-color="#102B49" /><stop offset=".62" stop-color="#061525" /><stop offset="1" stop-color="#010711" />
		</radialGradient>
		<linearGradient id="rb-suit" x1="150" y1="420" x2="430" y2="650" gradientUnits="userSpaceOnUse">
			<stop stop-color="#334D6B" /><stop offset=".38" stop-color="#182C45" /><stop offset="1" stop-color="#081423" />
		</linearGradient>
		<linearGradient id="rb-chest" x1="205" y1="450" x2="360" y2="600" gradientUnits="userSpaceOnUse">
			<stop stop-color="#F8FCFF" /><stop offset=".42" stop-color="#C5D2DF" /><stop offset="1" stop-color="#687B91" />
		</linearGradient>
		<radialGradient id="rb-eye" cx="50%" cy="40%" r="70%">
			<stop stop-color="#E7FBFF" /><stop offset=".35" stop-color="#8DE3FF" /><stop offset="1" stop-color="#2DB5F5" />
		</radialGradient>
		<linearGradient id="rb-reflection" x1="0" y1="0" x2="1" y2="1">
			<stop stop-color="#fff" stop-opacity=".8" /><stop offset=".45" stop-color="#fff" stop-opacity=".12" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
		</linearGradient>
		<filter id="rb-blueGlow" x="-80%" y="-80%" width="260%" height="260%">
			<feGaussianBlur stdDeviation="8" result="b" />
			<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
		</filter>
		<filter id="rb-softGlow" x="-80%" y="-80%" width="260%" height="260%">
			<feGaussianBlur stdDeviation="18" />
		</filter>
	</defs>
</svg>
