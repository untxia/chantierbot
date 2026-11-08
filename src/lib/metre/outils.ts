import type { LigneMetre, Parametres, Unite } from './types';

export class ErreurMetre extends Error {}

/** Lit un nombre de paramètres en vérifiant ses bornes. */
export function nombre(p: Parametres, id: string, label: string, min: number, max: number): number {
	const v = Number(p[id]);
	if (!Number.isFinite(v) || v < min || v > max) {
		throw new ErreurMetre(`${label} : valeur attendue entre ${min} et ${max}.`);
	}
	return v;
}

export function booleen(p: Parametres, id: string): boolean {
	return p[id] === true || p[id] === 'true';
}

export function texte(p: Parametres, id: string, autorises: string[], defaut: string): string {
	const v = String(p[id] ?? defaut);
	return autorises.includes(v) ? v : defaut;
}

/** Arrondi à l'unité supérieure, sans être piégé par les imprécisions (20,0000001 → 20). */
export function arrondiSup(x: number): number {
	return Math.ceil(x - 1e-9);
}

export function arrondi(x: number, decimales = 2): number {
	const f = 10 ** decimales;
	return Math.round(x * f) / f;
}

export function nf(x: number, decimales = 2): string {
	return arrondi(x, decimales).toLocaleString('fr-FR', { maximumFractionDigits: decimales });
}

/** Construit une ligne : pertes appliquées puis conversion en unités de vente. */
export function ligne(o: {
	code: string;
	designation: string;
	quantite: number;
	unite: Unite;
	perte: number;
	/** Contenance d'une unité de vente, dans la même unité que la quantité. */
	contenance?: number;
	conditionnement?: string;
	calcul: string;
	fiabilite?: 'standard' | 'estimation';
	sources?: string[];
}): LigneMetre {
	const avecPerte = o.quantite * (1 + o.perte);
	const achat =
		o.contenance && o.contenance > 0 && o.conditionnement
			? { nombre: Math.max(1, arrondiSup(avecPerte / o.contenance)), conditionnement: o.conditionnement }
			: o.unite === 'u'
				? { nombre: Math.max(1, arrondiSup(avecPerte)), conditionnement: 'à l’unité' }
				: null;
	return {
		code: o.code,
		designation: o.designation,
		quantite: arrondi(o.quantite),
		unite: o.unite,
		perte: o.perte,
		quantiteAvecPerte: arrondi(avecPerte),
		achat,
		calcul: o.calcul,
		fiabilite: o.fiabilite ?? 'standard',
		sources: o.sources ?? []
	};
}
