import type { ResultatMetre } from './types';

/** Une ligne chiffrée : on facture ce qu'on achète (sacs, cartons, pièces), sinon la quantité. */
export interface LigneChiffree {
	code: string;
	description: string;
	quantite: number;
	unite: string;
	prixUnitaire: number;
	total: number;
	type: 'material' | 'labor';
}

export interface Chiffrage {
	lignes: LigneChiffree[];
	totalMateriaux: number;
	totalMainOeuvre: number;
	total: number;
	/** Lignes de fourniture encore sans prix. */
	sansPrix: number;
}

const arrondi2 = (x: number) => Math.round(x * 100) / 100;

/** Clé d'un prix : la fourniture ET l'unité d'achat (32 € le carton ≠ 32 € le m²). */
export function clePrix(code: string, unite: string): string {
	return `${code}|${unite}`;
}

/**
 * Chiffre un résultat de métré avec les prix de l'artisan.
 * @param prix prix HT par unité d'achat, indexés par clePrix(code, unité)
 * @param mainOeuvreM2 prix HT de la pose au m² (0 = pas de ligne de main-d'œuvre)
 */
export function chiffrer(resultat: ResultatMetre, surface: number, prix: Record<string, number>, mainOeuvreM2 = 0): Chiffrage {
	const lignes: LigneChiffree[] = resultat.lignes.map((l) => {
		const quantite = l.achat ? l.achat.nombre : l.quantiteAvecPerte;
		const unite = l.achat ? (l.achat.conditionnement === 'à l’unité' ? 'u' : l.achat.conditionnement) : l.unite;
		const pu = Math.max(0, Number(prix[clePrix(l.code, unite)]) || 0);
		return { code: l.code, description: l.designation, quantite, unite, prixUnitaire: pu, total: arrondi2(quantite * pu), type: 'material' };
	});
	if (mainOeuvreM2 > 0 && surface > 0) {
		lignes.push({
			code: 'main-oeuvre',
			description: `Main-d’œuvre — ${resultat.ouvrage.toLowerCase()}`,
			quantite: surface,
			unite: 'm²',
			prixUnitaire: mainOeuvreM2,
			total: arrondi2(surface * mainOeuvreM2),
			type: 'labor'
		});
	}
	const totalMateriaux = arrondi2(lignes.filter((l) => l.type === 'material').reduce((s, l) => s + l.total, 0));
	const totalMainOeuvre = arrondi2(lignes.filter((l) => l.type === 'labor').reduce((s, l) => s + l.total, 0));
	return {
		lignes,
		totalMateriaux,
		totalMainOeuvre,
		total: arrondi2(totalMateriaux + totalMainOeuvre),
		sansPrix: lignes.filter((l) => l.type === 'material' && l.prixUnitaire === 0).length
	};
}

/** Brouillon au format lu par la page Devis IA (/rapports). */
export function versBrouillonDevis(o: { resultat: ResultatMetre; surface: number; chiffrage: Chiffrage; chantierId: string | null; metier: string; avertissements: string[] }) {
	return {
		source: 'metre',
		chantierId: o.chantierId,
		createdAt: new Date().toISOString(),
		description: `Fournitures calculées par le métré pour ${o.surface.toLocaleString('fr-FR')} m² (${o.resultat.ouvrage.toLowerCase()}), d’après les règles de consommation des fiches techniques. Prix saisis par l’artisan.`,
		detectedWorks: [o.resultat.ouvrage],
		quantities: [],
		estimate: {
			title: `${o.resultat.ouvrage} — ${o.surface.toLocaleString('fr-FR')} m²`,
			trade: o.metier,
			lines: o.chiffrage.lignes.map((l) => ({
				description: l.description,
				quantity: l.quantite,
				unit: l.unite,
				unitPrice: l.prixUnitaire,
				total: l.total,
				type: l.type
			})),
			totalMaterials: o.chiffrage.totalMateriaux,
			totalLabor: o.chiffrage.totalMainOeuvre,
			total: o.chiffrage.total,
			confidence: 'calcul',
			notes: o.avertissements
		}
	};
}
