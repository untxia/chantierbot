<script lang="ts">
	const STORAGE_KEY = 'chantierbot-background';
	const fallback = '/assets/backgrounds/chantier-general.webp?v=2';

	const allowed: Record<string, string> = {
		general: fallback,
		plombier: '/assets/backgrounds/plombier.webp?v=2',
		paysagiste: '/assets/backgrounds/paysagiste.webp?v=2',
		macon: '/assets/backgrounds/macon.webp?v=2',
		electricien: '/assets/backgrounds/electricien.webp',
		peintre: '/assets/backgrounds/peintre.webp?v=2',
		carreleur: '/assets/backgrounds/carreleur.webp',
		couvreur: '/assets/backgrounds/couvreur.webp',
		charpentier: '/assets/backgrounds/charpentier.webp',
		plaquiste: '/assets/backgrounds/plaquiste.webp'
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
