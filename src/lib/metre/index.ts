import type { Ouvrage, Parametres, ResultatMetre, Unite } from './types';
import { OUVRAGES_CARRELAGE } from './ouvrages/carrelage';
import { OUVRAGES_PEINTURE } from './ouvrages/peinture';
import { OUVRAGES_PLATRERIE } from './ouvrages/platrerie';
import { OUVRAGES_ESPACES_VERTS } from './ouvrages/espaces-verts';
import { ErreurMetre } from './outils';

export * from './types';
export { SOURCES } from './sources';
export { ErreurMetre } from './outils';
export { chiffrer, clePrix, minusculeInitiale, versBrouillonDevis, type Chiffrage, type LigneChiffree, type Reference } from './chiffrage';

/** Métiers disponibles dans la bibliothèque. Ajouter un métier = ajouter un fichier d'ouvrages. */
export const METIERS = [
	{ code: 'carreleur', label: 'Carrelage', ouvrages: OUVRAGES_CARRELAGE },
	{ code: 'peintre', label: 'Peinture', ouvrages: OUVRAGES_PEINTURE },
	{ code: 'plaquiste', label: 'Plâtrerie', ouvrages: OUVRAGES_PLATRERIE },
	{ code: 'paysagiste', label: 'Espaces verts', ouvrages: OUVRAGES_ESPACES_VERTS }
];

export const OUVRAGES: Ouvrage[] = METIERS.flatMap((m) => m.ouvrages);

export function trouverOuvrage(code: string): Ouvrage | undefined {
	return OUVRAGES.find((o) => o.code === code);
}

/** Valeurs par défaut des champs d'un ouvrage, éventuellement complétées. */
export function parametresParDefaut(o: Ouvrage, depart: Parametres = {}): Parametres {
	const p: Parametres = {};
	for (const c of o.champs) p[c.id] = c.id in depart ? depart[c.id] : c.defaut;
	return p;
}

/** Quantité de référence d'un ouvrage (surface en m² par défaut). */
export function referenceDe(o: Ouvrage, p: Parametres): { valeur: number; unite: Unite } {
	return o.reference ? o.reference(p) : { valeur: Number(p.surface) || 0, unite: 'm²' };
}

/** Vrai si tous les champs obligatoires sont renseignés (valeur > 0). */
export function pretACalculer(o: Ouvrage, p: Parametres): boolean {
	return o.champs.every((c) => c.type !== 'number' || !c.requis || Number(p[c.id]) > 0);
}

export function calculer(code: string, p: Parametres): ResultatMetre {
	const o = trouverOuvrage(code);
	if (!o) throw new ErreurMetre('Ouvrage inconnu.');
	return o.calculer(p);
}
