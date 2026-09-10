<script lang="ts">
	const STORAGE_KEY = 'chantierbot-background';
	const fallback = '/assets/backgrounds/chantier-general.webp';

	const allowed: Record<string, string> = {
		general: fallback,
		plombier: '/assets/backgrounds/plombier.webp',
		paysagiste: '/assets/backgrounds/paysagiste.webp',
		macon: '/assets/backgrounds/macon.webp',
		electricien: '/assets/backgrounds/electricien.webp',
		peintre: '/assets/backgrounds/peintre.svg',
		carreleur: '/assets/backgrounds/carreleur.svg',
		couvreur: '/assets/backgrounds/couvreur.svg',
		charpentier: '/assets/backgrounds/charpentier.svg',
		plaquiste: '/assets/backgrounds/plaquiste.svg'
	};

	let src = fallback;

	function syncBackground() {
		if (typeof window === 'undefined') return;
		const id = window.localStorage.getItem(STORAGE_KEY) || 'general';
		src = allowed[id] || fallback;
	}

	syncBackground();

	if (typeof window !== 'undefined') {
		window.addEventListener('chantierbot-background-change', syncBackground);
	}
</script>

<div class="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat" style={`background-image: url('${src}')`} aria-hidden="true"></div>
