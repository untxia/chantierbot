import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const KEY = 'chantierbot-appearance';

export interface Appearance {
	/** Flou des surfaces vitrées, en px (0–24). */
	blur: number;
	/** Opacité du voile sombre sur la photo du tableau de bord, en % (0–80). */
	veil: number;
	/** Intensité de l'effet flottant des cartes, en % (0 = désactivé). */
	float: number;
}

export const APPEARANCE_DEFAULTS: Appearance = { blur: 4, veil: 40, float: 60 };

function clamp(value: unknown, min: number, max: number, fallback: number): number {
	const n = Number(value);
	return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function load(): Appearance {
	if (!browser) return APPEARANCE_DEFAULTS;
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (raw && typeof raw === 'object') {
			return {
				blur: clamp(raw.blur, 0, 24, APPEARANCE_DEFAULTS.blur),
				veil: clamp(raw.veil, 0, 80, APPEARANCE_DEFAULTS.veil),
				float: clamp(raw.float, 0, 100, APPEARANCE_DEFAULTS.float)
			};
		}
	} catch {
		/* stockage indisponible ou corrompu : valeurs par défaut */
	}
	return APPEARANCE_DEFAULTS;
}

export const appearance = writable<Appearance>(load());

/** Applique les réglages au document (variables CSS) et les mémorise. */
export function applyAppearance(value: Appearance) {
	if (!browser) return;
	const root = document.documentElement.style;
	root.setProperty('--cb-blur', `${value.blur}px`);
	root.setProperty('--cb-veil', String(value.veil / 100));
	root.setProperty('--cb-float', String(value.float / 100));
	try {
		localStorage.setItem(KEY, JSON.stringify(value));
	} catch {
		/* ignoré : le réglage vaut pour la session */
	}
}
