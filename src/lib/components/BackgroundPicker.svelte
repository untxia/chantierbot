<script lang="ts">
	const STORAGE_KEY = 'chantierbot-background';

	const backgrounds = [
		{ id: 'general', label: 'Chantier', subtitle: 'Général', icon: '🏗️', src: '/assets/backgrounds/chantier-general.webp' },
		{ id: 'plombier', label: 'Plombier', subtitle: 'Plomberie', icon: '🔧', src: '/assets/backgrounds/plombier.webp' },
		{ id: 'paysagiste', label: 'Paysagiste', subtitle: 'Extérieurs', icon: '🌿', src: '/assets/backgrounds/paysagiste.webp' },
		{ id: 'macon', label: 'Maçon', subtitle: 'Gros œuvre', icon: '🧱', src: '/assets/backgrounds/macon.webp' },
		{ id: 'electricien', label: 'Électricien', subtitle: 'Électricité', icon: '⚡', src: '/assets/backgrounds/electricien.webp' },
		{ id: 'peintre', label: 'Peintre', subtitle: 'Peinture', icon: '🎨', src: '/assets/backgrounds/peintre.webp' },
		{ id: 'carreleur', label: 'Carreleur', subtitle: 'Carrelage', icon: '◻️', src: '/assets/backgrounds/carreleur.webp' },
		{ id: 'couvreur', label: 'Couvreur', subtitle: 'Toiture', icon: '🏠', src: '/assets/backgrounds/couvreur.webp' },
		{ id: 'charpentier', label: 'Charpentier', subtitle: 'Structure bois', icon: '🪵', src: '/assets/backgrounds/charpentier.webp' },
		{ id: 'plaquiste', label: 'Plaquiste', subtitle: 'Cloisons & plafonds', icon: '🧱', src: '/assets/backgrounds/plaquiste.webp' }
	] as const;

	let selected = 'general';

	if (typeof window !== 'undefined') {
		selected = window.localStorage.getItem(STORAGE_KEY) || 'general';
	}

	function selectBackground(id: string) {
		selected = id;
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(STORAGE_KEY, id);
			window.dispatchEvent(new CustomEvent('chantierbot-background-change', { detail: id }));
		}
	}
</script>

<section class="mt-8 rounded-2xl border border-black/5 bg-surface p-5 shadow-card dark:border-white/10 dark:bg-surface-dark">
	<div class="mb-4">
		<p class="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Personnalisation</p>
		<h2 class="section-title">Choisissez votre métier</h2>
		<p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Le fond et le profil métier sont enregistrés automatiquement sur cet appareil.</p>
	</div>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
		{#each backgrounds as background}
			<button type="button" on:click={() => selectBackground(background.id)} class="group overflow-hidden rounded-xl border text-left transition-all {selected === background.id ? 'border-primary ring-2 ring-primary/30 shadow-card-hover' : 'border-black/10 hover:border-primary/30 dark:border-white/10'}" aria-pressed={selected === background.id}>
				<div class="relative aspect-video overflow-hidden bg-dark-navy">
					<img src={background.src} alt="Fond {background.label}" class="h-full w-full object-cover transition-transform duration-normal group-hover:scale-105" />
					<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6"><span class="text-base" aria-hidden="true">{background.icon}</span></div>
					{#if selected === background.id}<span class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm">✓</span>{/if}
				</div>
				<div class="bg-white px-3 py-2.5 dark:bg-surface-dark"><p class="text-sm font-bold">{background.label}</p><p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">{background.subtitle}</p></div>
			</button>
		{/each}
	</div>
</section>
