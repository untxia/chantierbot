/** Bibliothèque de métré : types partagés (aucune dépendance, testable hors navigateur). */

export type Unite = 'm²' | 'ml' | 'kg' | 'L' | 'u' | 'm³';

/** Un champ du formulaire d'un ouvrage (le formulaire est généré à partir de cette liste). */
export type Champ =
	| { id: string; label: string; type: 'number'; unite?: string; defaut: number; min: number; max: number; pas?: number; aide?: string; requis?: boolean }
	| { id: string; label: string; type: 'select'; defaut: string; options: { valeur: string; label: string }[]; aide?: string }
	| { id: string; label: string; type: 'boolean'; defaut: boolean; aide?: string };

export type Parametres = Record<string, number | string | boolean>;

export interface Source {
	id: string;
	titre: string;
	url: string;
}

export interface LigneMetre {
	code: string;
	designation: string;
	/** Quantité théorique, sans pertes. */
	quantite: number;
	unite: Unite;
	/** Taux de perte appliqué (0,1 = 10 %). */
	perte: number;
	quantiteAvecPerte: number;
	/** Nombre d'unités de vente à acheter, si un conditionnement est connu. */
	achat: { nombre: number; conditionnement: string } | null;
	/** Explication du calcul, lisible par l'artisan. */
	calcul: string;
	/** « estimation » : règle approximative, à ajuster selon le chantier. */
	fiabilite: 'standard' | 'estimation';
	sources: string[];
}

export interface ResultatMetre {
	ouvrage: string;
	lignes: LigneMetre[];
	avertissements: string[];
}

export interface Ouvrage {
	code: string;
	metier: string;
	designation: string;
	description: string;
	champs: Champ[];
	/** Quantité de référence (pour l'affichage et la main-d'œuvre). Par défaut : le champ « surface » en m². */
	reference?: (p: Parametres) => { valeur: number; unite: Unite };
	calculer: (p: Parametres) => ResultatMetre;
}
