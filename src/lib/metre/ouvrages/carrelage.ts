import type { Champ, LigneMetre, Ouvrage, Parametres, ResultatMetre } from '../types';
import { booleen, ligne, nf, nombre, texte } from '../outils';

/*
 * Règles de consommation « carrelage », tirées des fiches techniques citées dans sources.ts.
 * Valeurs centrales de fourchettes de fabricants : toujours vérifier la fiche du produit choisi.
 */

const SAC_COLLE_KG = 25;
const SAC_JOINT_KG = 5;
const SAC_RAGREAGE_KG = 25;
const BIDON_PRIMAIRE_KG = 5;
const SACHET_CROISILLONS = 200;
const BAGUETTE_ML = 2.5;

/** Masse volumique d'un joint ciment (kg/dm³) : 1,6 à 1,9 selon les fiches. */
const DENSITE_JOINT = 1.6;
/** Ragréage : 1,4 à 1,6 kg/m² par mm d'épaisseur selon les fiches. */
const RAGREAGE_KG_M2_MM = 1.5;
/** Primaire : 100 à 200 g/m² selon la porosité. */
const PRIMAIRE_KG_M2 = 0.15;

/** Consommation de colle C2 selon la surface d'un carreau (cm²) — valeurs centrales des fiches. */
export function consommationColle(surfaceCarreauCm2: number): { kgM2: number; mode: string } {
	if (surfaceCarreauCm2 <= 400) return { kgM2: 4, mode: 'simple encollage, peigne 6 mm (3,5 à 4,5 kg/m²)' };
	if (surfaceCarreauCm2 <= 1600) return { kgM2: 6, mode: 'double encollage, peigne 9 mm (5 à 7 kg/m²)' };
	return { kgM2: 7, mode: 'double encollage, peigne 9 à 10 mm (6 à 8 kg/m²)' };
}

/**
 * Consommation de joint en kg/m² : (A + B) / (A × B) × épaisseur × largeur du joint × masse volumique,
 * toutes les dimensions en mm.
 */
export function consommationJoint(longueurMm: number, largeurMm: number, epaisseurMm: number, jointMm: number, densite = DENSITE_JOINT): number {
	return ((longueurMm + largeurMm) / (longueurMm * largeurMm)) * epaisseurMm * jointMm * densite;
}

const champsFormat: Champ[] = [
	{ id: 'longueur', label: 'Longueur du carreau', type: 'number', unite: 'cm', defaut: 60, min: 1, max: 320, requis: true },
	{ id: 'largeur', label: 'Largeur du carreau', type: 'number', unite: 'cm', defaut: 60, min: 1, max: 320, requis: true },
	{ id: 'epaisseur', label: 'Épaisseur du carreau', type: 'number', unite: 'mm', defaut: 9, min: 3, max: 30 },
	{ id: 'joint', label: 'Largeur du joint', type: 'number', unite: 'mm', defaut: 3, min: 1, max: 20 },
	{
		id: 'pose',
		label: 'Type de pose',
		type: 'select',
		defaut: 'droite',
		options: [
			{ valeur: 'droite', label: 'Droite (perte 10 %)' },
			{ valeur: 'decalee', label: 'Décalée / à joints perdus (perte 12 %)' },
			{ valeur: 'diagonale', label: 'Diagonale (perte 15 %)' }
		]
	},
	{ id: 'm2Carton', label: 'Surface par carton', type: 'number', unite: 'm²', defaut: 0, min: 0, max: 20, pas: 0.01, aide: 'Indiquée sur le carton. 0 = inconnue.' }
];

const PERTES_POSE: Record<string, number> = { droite: 0.1, decalee: 0.12, diagonale: 0.15 };

/** Reprend une liste de champs en changeant les valeurs par défaut des champs numériques. */
function avecDefauts(champs: Champ[], defauts: Record<string, number>): Champ[] {
	return champs.map((c) => (c.type === 'number' && c.id in defauts ? { ...c, defaut: defauts[c.id] } : c));
}

/** Lignes communes carreaux + colle + joint + croisillons. */
function lignesCarrelage(p: Parametres, surface: number): { lignes: LigneMetre[]; avertissements: string[] } {
	const L = nombre(p, 'longueur', 'Longueur du carreau', 1, 320);
	const l = nombre(p, 'largeur', 'Largeur du carreau', 1, 320);
	const e = nombre(p, 'epaisseur', 'Épaisseur du carreau', 3, 30);
	const j = nombre(p, 'joint', 'Largeur du joint', 1, 20);
	const pose = texte(p, 'pose', Object.keys(PERTES_POSE), 'droite');
	const m2Carton = nombre(p, 'm2Carton', 'Surface par carton', 0, 20);
	const perte = PERTES_POSE[pose];
	const avertissements: string[] = [];

	const lignes: LigneMetre[] = [];
	lignes.push(
		ligne({
			code: 'carreaux',
			designation: `Carreaux ${nf(L, 1)} × ${nf(l, 1)} cm`,
			quantite: surface,
			unite: 'm²',
			perte,
			contenance: m2Carton > 0 ? m2Carton : undefined,
			conditionnement: m2Carton > 0 ? `carton de ${nf(m2Carton)} m²` : undefined,
			calcul: `${nf(surface)} m² + ${nf(perte * 100, 0)} % de chutes (pose ${pose})`
		})
	);
	if (m2Carton === 0) avertissements.push('Indiquez la surface par carton pour obtenir le nombre de cartons.');

	const surfaceCarreau = L * l;
	const colle = consommationColle(surfaceCarreau);
	lignes.push(
		ligne({
			code: 'colle-c2',
			designation: 'Mortier-colle C2',
			quantite: surface * colle.kgM2,
			unite: 'kg',
			perte: 0.05,
			contenance: SAC_COLLE_KG,
			conditionnement: `sac de ${SAC_COLLE_KG} kg`,
			calcul: `${nf(surface)} m² × ${nf(colle.kgM2)} kg/m² (carreau de ${nf(surfaceCarreau, 0)} cm² : ${colle.mode}) + 5 %`,
			sources: ['colle-castorama', 'colle-bostik', 'colle-samse']
		})
	);

	const jointKgM2 = consommationJoint(L * 10, l * 10, e, j);
	lignes.push(
		ligne({
			code: 'joint',
			designation: `Joint ciment (${nf(j, 1)} mm)`,
			quantite: surface * jointKgM2,
			unite: 'kg',
			perte: 0.1,
			contenance: SAC_JOINT_KG,
			conditionnement: `sac de ${SAC_JOINT_KG} kg`,
			calcul: `(${nf(L * 10, 0)} + ${nf(l * 10, 0)}) ÷ (${nf(L * 10, 0)} × ${nf(l * 10, 0)}) × ${nf(e, 1)} × ${nf(j, 1)} × ${DENSITE_JOINT} = ${nf(jointKgM2, 3)} kg/m², × ${nf(surface)} m² + 10 %`,
			sources: ['joint-vicat']
		})
	);

	const carreauxParM2 = 10000 / surfaceCarreau;
	const nbCarreaux = surface * carreauxParM2;
	lignes.push(
		ligne({
			code: 'croisillons',
			designation: surfaceCarreau >= 3600 ? 'Cales / croisillons (ou système autonivelant)' : 'Croisillons',
			quantite: nbCarreaux,
			unite: 'u',
			perte: 0.1,
			contenance: SACHET_CROISILLONS,
			conditionnement: `sachet de ${SACHET_CROISILLONS}`,
			calcul: `environ 1 par carreau : ${nf(surface)} m² × ${nf(carreauxParM2, 2)} carreaux/m² + 10 %`,
			fiabilite: 'estimation'
		})
	);
	return { lignes, avertissements };
}

function lignesPreparation(surface: number, ragreageMm: number, primaire: boolean): LigneMetre[] {
	const out: LigneMetre[] = [];
	if (primaire || ragreageMm > 0) {
		out.push(
			ligne({
				code: 'primaire',
				designation: 'Primaire d’accrochage',
				quantite: surface * PRIMAIRE_KG_M2,
				unite: 'kg',
				perte: 0,
				contenance: BIDON_PRIMAIRE_KG,
				conditionnement: `bidon de ${BIDON_PRIMAIRE_KG} kg`,
				calcul: `${nf(surface)} m² × ${nf(PRIMAIRE_KG_M2)} kg/m² (100 à 200 g/m² selon la porosité), 1 couche`,
				sources: ['primaire-bostik']
			})
		);
	}
	if (ragreageMm > 0) {
		out.push(
			ligne({
				code: 'ragreage',
				designation: `Ragréage autolissant (${nf(ragreageMm, 1)} mm)`,
				quantite: surface * ragreageMm * RAGREAGE_KG_M2_MM,
				unite: 'kg',
				perte: 0.05,
				contenance: SAC_RAGREAGE_KG,
				conditionnement: `sac de ${SAC_RAGREAGE_KG} kg`,
				calcul: `${nf(surface)} m² × ${nf(ragreageMm, 1)} mm × ${RAGREAGE_KG_M2_MM} kg/m²/mm + 5 %`,
				sources: ['ragreage-mapei', 'ragreage-prb']
			})
		);
	}
	return out;
}

export const carrelageSol: Ouvrage = {
	code: 'carrelage-sol',
	metier: 'carreleur',
	designation: 'Carrelage au sol (collé)',
	description: 'Carreaux, colle, joint, croisillons, plinthes, et en option primaire et ragréage.',
	champs: [
		{ id: 'surface', label: 'Surface à carreler', type: 'number', unite: 'm²', defaut: 0, min: 0.1, max: 10000, pas: 0.01, requis: true },
		...champsFormat,
		{ id: 'perimetre', label: 'Périmètre de la pièce (plinthes)', type: 'number', unite: 'ml', defaut: 0, min: 0, max: 2000, pas: 0.01, aide: '0 = pas de plinthes.' },
		{ id: 'portes', label: 'Largeur des portes à déduire', type: 'number', unite: 'ml', defaut: 0, min: 0, max: 100, pas: 0.01 },
		{ id: 'longueurPlinthe', label: 'Longueur d’une plinthe', type: 'number', unite: 'cm', defaut: 60, min: 10, max: 300 },
		{ id: 'ragreage', label: 'Épaisseur de ragréage', type: 'number', unite: 'mm', defaut: 0, min: 0, max: 30, pas: 0.5, aide: '0 = sol déjà plan.' },
		{ id: 'primaire', label: 'Primaire d’accrochage', type: 'boolean', defaut: false, aide: 'Ajouté automatiquement en cas de ragréage.' }
	],
	calculer(p): ResultatMetre {
		const surface = nombre(p, 'surface', 'Surface', 0.1, 10000);
		const { lignes, avertissements } = lignesCarrelage(p, surface);
		const ragreageMm = nombre(p, 'ragreage', 'Épaisseur de ragréage', 0, 30);
		lignes.unshift(...lignesPreparation(surface, ragreageMm, booleen(p, 'primaire')));

		const perimetre = nombre(p, 'perimetre', 'Périmètre', 0, 2000);
		if (perimetre > 0) {
			const portes = nombre(p, 'portes', 'Largeur des portes', 0, 100);
			const longueurPlinthe = nombre(p, 'longueurPlinthe', 'Longueur d’une plinthe', 10, 300) / 100;
			const lineaire = Math.max(0, perimetre - portes);
			lignes.push(
				ligne({
					code: 'plinthes',
					designation: `Plinthes (${nf(longueurPlinthe * 100, 0)} cm)`,
					quantite: lineaire / longueurPlinthe,
					unite: 'u',
					perte: 0.1,
					calcul: `(${nf(perimetre)} ml − ${nf(portes)} ml de portes) = ${nf(lineaire)} ml ÷ ${nf(longueurPlinthe)} m + 10 %`
				})
			);
			if (portes === 0) avertissements.push('Pensez à déduire la largeur des portes du périmètre des plinthes.');
		}
		if (consommationColle(nombre(p, 'longueur', 'Longueur', 1, 320) * nombre(p, 'largeur', 'Largeur', 1, 320)).kgM2 >= 6) {
			avertissements.push('Grand format : double encollage recommandé (colle sur le support et au dos du carreau).');
		}
		return { ouvrage: this.designation, lignes, avertissements };
	}
};

export const faienceMurale: Ouvrage = {
	code: 'faience-murale',
	metier: 'carreleur',
	designation: 'Faïence murale (collée)',
	description: 'Carreaux muraux, colle, joint, croisillons et baguettes d’angle.',
	champs: [
		{ id: 'surface', label: 'Surface à carreler', type: 'number', unite: 'm²', defaut: 0, min: 0.1, max: 10000, pas: 0.01, requis: true },
		...avecDefauts(champsFormat, { longueur: 40, largeur: 25, epaisseur: 7, joint: 2 }),
		{ id: 'angles', label: 'Longueur des angles et arêtes', type: 'number', unite: 'ml', defaut: 0, min: 0, max: 1000, pas: 0.01, aide: 'Pour les baguettes de finition. 0 = aucune.' }
	],
	calculer(p): ResultatMetre {
		const surface = nombre(p, 'surface', 'Surface', 0.1, 10000);
		const { lignes, avertissements } = lignesCarrelage(p, surface);
		const angles = nombre(p, 'angles', 'Longueur des angles', 0, 1000);
		if (angles > 0) {
			lignes.push(
				ligne({
					code: 'baguettes',
					designation: `Baguettes d’angle (${nf(BAGUETTE_ML)} m)`,
					quantite: angles,
					unite: 'ml',
					perte: 0.1,
					contenance: BAGUETTE_ML,
					conditionnement: `baguette de ${nf(BAGUETTE_ML)} m`,
					calcul: `${nf(angles)} ml + 10 %`
				})
			);
		}
		avertissements.push('Vérifiez que la colle choisie est adaptée à la pose murale (glissement limité, classe T).');
		return { ouvrage: this.designation, lignes, avertissements };
	}
};

export const ragreageSol: Ouvrage = {
	code: 'ragreage-sol',
	metier: 'carreleur',
	designation: 'Ragréage de sol',
	description: 'Primaire d’accrochage et ragréage autolissant.',
	champs: [
		{ id: 'surface', label: 'Surface', type: 'number', unite: 'm²', defaut: 0, min: 0.1, max: 10000, pas: 0.01, requis: true },
		{ id: 'ragreage', label: 'Épaisseur moyenne', type: 'number', unite: 'mm', defaut: 3, min: 1, max: 30, pas: 0.5, requis: true }
	],
	calculer(p): ResultatMetre {
		const surface = nombre(p, 'surface', 'Surface', 0.1, 10000);
		const mm = nombre(p, 'ragreage', 'Épaisseur', 1, 30);
		const avertissements = ['Mesurez l’épaisseur moyenne à plusieurs endroits : un écart de 1 mm change la quantité de 30 % à 3 mm.'];
		return { ouvrage: this.designation, lignes: lignesPreparation(surface, mm, true), avertissements };
	}
};

export const OUVRAGES_CARRELAGE = [carrelageSol, faienceMurale, ragreageSol];
