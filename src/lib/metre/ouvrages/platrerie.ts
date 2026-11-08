import type { Ouvrage, ResultatMetre } from '../types';
import { arrondiSup, booleen, ErreurMetre, ligne, nf, nombre } from '../outils';

/*
 * Cloison distributive 72/48 (ossature métallique M48, 1 plaque BA13 par face).
 * Ratios issus du quantitatif Placostil (Placo / Samse) : environ 2,1 m² de plaque,
 * 22 vis TTPC et 2,8 ml de bande par m² de cloison ; montants tous les 60 cm.
 */

const PLAQUE_M2 = 1.2 * 2.5;
const RAIL_ML = 3;
const VIS_PAR_M2 = 22;
const BOITE_VIS = 1000;
const BANDE_ML_M2 = 2.8;
const ROULEAU_BANDE_ML = 150;
const ENDUIT_KG_M2 = 1; // 0,5 kg/m² de plaque × 2 faces
const SAC_ENDUIT_KG = 25;

export const cloison7248: Ouvrage = {
	code: 'cloison-72-48',
	metier: 'plaquiste',
	designation: 'Cloison 72/48 (BA13, 1 plaque par face)',
	description: 'Plaques, rails, montants, vis, bande et enduit ; isolant en option.',
	champs: [
		{ id: 'longueur', label: 'Longueur de la cloison', type: 'number', unite: 'm', defaut: 0, min: 0.1, max: 1000, pas: 0.01, requis: true },
		{ id: 'hauteur', label: 'Hauteur sous plafond', type: 'number', unite: 'm', defaut: 2.5, min: 1, max: 6, pas: 0.01, requis: true },
		{ id: 'ouvertures', label: 'Surface des ouvertures (portes)', type: 'number', unite: 'm²', defaut: 0, min: 0, max: 500, pas: 0.01, aide: 'Une porte standard ≈ 1,7 m².' },
		{ id: 'isolant', label: 'Isolant laine minérale 45 mm', type: 'boolean', defaut: true }
	],
	reference: (p) => ({ valeur: Math.max(0, Number(p.longueur) * Number(p.hauteur) - Number(p.ouvertures || 0)), unite: 'm²' }),
	calculer(p): ResultatMetre {
		const longueur = nombre(p, 'longueur', 'Longueur', 0.1, 1000);
		const hauteur = nombre(p, 'hauteur', 'Hauteur', 1, 6);
		const ouvertures = nombre(p, 'ouvertures', 'Ouvertures', 0, 500);
		const surface = Math.max(0, longueur * hauteur - ouvertures);
		if (surface <= 0) throw new ErreurMetre('Les ouvertures dépassent la surface de la cloison.');

		const nbMontants = arrondiSup(longueur / 0.6) + 1;
		const lignes = [
			ligne({
				code: 'plaques-ba13',
				designation: 'Plaques BA13 (1,20 × 2,50 m)',
				quantite: surface * 2,
				unite: 'm²',
				perte: 0.05,
				contenance: PLAQUE_M2,
				conditionnement: 'plaque de 3 m²',
				calcul: `${nf(surface)} m² de cloison × 2 faces + 5 % de chutes`,
				sources: ['cloison-placo', 'cloison-samse']
			}),
			ligne({
				code: 'rails-48',
				designation: 'Rails R48',
				quantite: longueur * 2,
				unite: 'ml',
				perte: 0.05,
				contenance: RAIL_ML,
				conditionnement: `rail de ${RAIL_ML} m`,
				calcul: `${nf(longueur)} m au sol + au plafond + 5 %`
			}),
			ligne({
				code: 'montants-48',
				designation: `Montants M48 (${nf(hauteur)} m)`,
				quantite: nbMontants,
				unite: 'u',
				perte: 0,
				calcul: `1 tous les 60 cm : ${nf(longueur)} m ÷ 0,60 arrondi + 1 = ${nbMontants} (prévoir des doublés autour des portes)`,
				sources: ['cloison-placo']
			}),
			ligne({
				code: 'vis-ttpc',
				designation: 'Vis TTPC 25',
				quantite: surface * VIS_PAR_M2,
				unite: 'u',
				perte: 0.1,
				contenance: BOITE_VIS,
				conditionnement: `boîte de ${BOITE_VIS}`,
				calcul: `${nf(surface)} m² × ${VIS_PAR_M2} vis/m² + 10 %`,
				sources: ['cloison-samse']
			}),
			ligne({
				code: 'bande-joint',
				designation: 'Bande à joint papier',
				quantite: surface * BANDE_ML_M2,
				unite: 'ml',
				perte: 0.05,
				contenance: ROULEAU_BANDE_ML,
				conditionnement: `rouleau de ${ROULEAU_BANDE_ML} m`,
				calcul: `${nf(surface)} m² × ${BANDE_ML_M2} ml/m² + 5 %`,
				sources: ['cloison-samse']
			}),
			ligne({
				code: 'enduit-joint',
				designation: 'Enduit à joint',
				quantite: surface * ENDUIT_KG_M2,
				unite: 'kg',
				perte: 0.05,
				contenance: SAC_ENDUIT_KG,
				conditionnement: `sac de ${SAC_ENDUIT_KG} kg`,
				calcul: `${nf(surface)} m² × ${ENDUIT_KG_M2} kg/m² (≈ 0,5 kg/m² par face) + 5 %`,
				fiabilite: 'estimation'
			})
		];
		if (booleen(p, 'isolant')) {
			lignes.push(
				ligne({
					code: 'isolant-45',
					designation: 'Laine minérale 45 mm',
					quantite: surface,
					unite: 'm²',
					perte: 0.05,
					calcul: `${nf(surface)} m² + 5 % (vérifiez la surface d’un rouleau ou d’un panneau)`
				})
			);
		}
		return {
			ouvrage: this.designation,
			lignes,
			avertissements: ['Ajoutez les montants doublés autour des huisseries et les renforts pour charges lourdes (meubles suspendus).']
		};
	}
};

export const OUVRAGES_PLATRERIE = [cloison7248];
