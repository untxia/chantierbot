import type { Ouvrage, Parametres, ResultatMetre } from './types';
import { OUVRAGES_CARRELAGE } from './ouvrages/carrelage';
import { ErreurMetre } from './outils';

export * from './types';
export { SOURCES } from './sources';
export { ErreurMetre } from './outils';

/** Métiers disponibles dans la bibliothèque. Ajouter un métier = ajouter un fichier d'ouvrages. */
export const METIERS = [{ code: 'carreleur', label: 'Carrelage', ouvrages: OUVRAGES_CARRELAGE }];

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

export function calculer(code: string, p: Parametres): ResultatMetre {
	const o = trouverOuvrage(code);
	if (!o) throw new ErreurMetre('Ouvrage inconnu.');
	return o.calculer(p);
}
