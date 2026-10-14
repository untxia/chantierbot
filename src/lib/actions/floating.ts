import { get } from 'svelte/store';
import { appearance } from '$lib/stores/appearance';

/**
 * Effet « flottant » : les cartes s'inclinent légèrement vers le pointeur.
 * Un seul écouteur délégué ; ignoré au tactile, avec « réduire les animations »,
 * sur les grandes sections et quand un champ de la carte a le focus.
 * Renvoie la fonction de nettoyage.
 */
export function initFloating(): () => void {
	if (typeof window === 'undefined') return () => {};

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
	let active: HTMLElement | null = null;

	function reset(el: HTMLElement) {
		el.style.removeProperty('--rx');
		el.style.removeProperty('--ry');
	}

	function onMove(event: PointerEvent) {
		if (event.pointerType !== 'mouse' || reduce.matches) return;

		const el = (event.target as Element | null)?.closest?.('.card, .card-glass') as HTMLElement | null;
		if (active && active !== el) {
			reset(active);
			active = null;
		}
		if (!el || el.matches(':focus-within')) return;

		const amplitude = (get(appearance).float / 100) * 5; // degrés max par axe
		const rect = el.getBoundingClientRect();
		if (amplitude === 0 || rect.width > 720) return;

		const px = (event.clientX - rect.left) / rect.width - 0.5;
		const py = (event.clientY - rect.top) / rect.height - 0.5;
		el.style.setProperty('--ry', `${(px * amplitude * 2).toFixed(2)}deg`);
		el.style.setProperty('--rx', `${(-py * amplitude * 2).toFixed(2)}deg`);
		active = el;
	}

	function onLeave() {
		if (active) reset(active);
		active = null;
	}

	document.addEventListener('pointermove', onMove, { passive: true });
	document.addEventListener('pointerleave', onLeave);
	return () => {
		document.removeEventListener('pointermove', onMove);
		document.removeEventListener('pointerleave', onLeave);
	};
}
