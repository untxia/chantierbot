import type { Ouvrage, ResultatMetre } from '../types';
import { booleen, ligne, nf, nombre } from '../outils';

/*
 * Peinture : rendement en m²/L PAR COUCHE. Les fiches donnent 8 à 10 m²/L pour une acrylique
 * mate courante (plus sur grandes surfaces lisses) : valeur modifiable, prendre celle du produit.
 */

export const peintureMurs: Ouvrage = {
	code: 'peinture-murs',
	metier: 'peintre',
	designation: 'Peinture murs et plafonds',
	description: 'Impression (sous-couche) et peinture de finition selon le nombre de couches.',
	champs: [
		{ id: 'surface', label: 'Surface à peindre', type: 'number', unite: 'm²', defaut: 0, min: 0.1, max: 100000, pas: 0.01, requis: true, aide: 'Murs + plafonds, ouvertures déduites.' },
		{ id: 'couches', label: 'Couches de finition', type: 'number', defaut: 2, min: 1, max: 4 },
		{ id: 'rendement', label: 'Rendement de la finition', type: 'number', unite: 'm²/L par couche', defaut: 9, min: 4, max: 20, pas: 0.5, aide: 'Indiqué sur la fiche du produit (8 à 10 en général).' },
		{ id: 'pot', label: 'Contenance d’un pot de finition', type: 'number', unite: 'L', defaut: 10, min: 0.5, max: 20, pas: 0.5 },
		{ id: 'impression', label: 'Couche d’impression', type: 'boolean', defaut: true, aide: 'Sur support neuf, poreux ou très contrasté.' },
		{ id: 'rendementImpression', label: 'Rendement de l’impression', type: 'number', unite: 'm²/L', defaut: 8, min: 3, max: 20, pas: 0.5 }
	],
	calculer(p): ResultatMetre {
		const surface = nombre(p, 'surface', 'Surface', 0.1, 100000);
		const couches = nombre(p, 'couches', 'Couches', 1, 4);
		const rendement = nombre(p, 'rendement', 'Rendement', 4, 20);
		const pot = nombre(p, 'pot', 'Contenance du pot', 0.5, 20);
		const lignes = [];
		const avertissements = ['Rendements théoriques sur support lisse et sain : majorez sur support poreux, brut ou rugueux.'];

		if (booleen(p, 'impression')) {
			const r = nombre(p, 'rendementImpression', 'Rendement de l’impression', 3, 20);
			lignes.push(
				ligne({
					code: 'impression',
					designation: 'Impression / sous-couche',
					quantite: surface / r,
					unite: 'L',
					perte: 0.05,
					contenance: pot,
					conditionnement: `pot de ${nf(pot, 1)} L`,
					calcul: `${nf(surface)} m² ÷ ${nf(r, 1)} m²/L + 5 %`,
					fiabilite: 'estimation'
				})
			);
		}
		lignes.push(
			ligne({
				code: 'peinture-finition',
				designation: `Peinture de finition (${couches} couche${couches > 1 ? 's' : ''})`,
				quantite: (surface * couches) / rendement,
				unite: 'L',
				perte: 0.05,
				contenance: pot,
				conditionnement: `pot de ${nf(pot, 1)} L`,
				calcul: `${nf(surface)} m² × ${couches} couche(s) ÷ ${nf(rendement, 1)} m²/L + 5 %`,
				sources: ['peinture-zolpan', 'peinture-tollens']
			})
		);
		return { ouvrage: this.designation, lignes, avertissements };
	}
};

export const OUVRAGES_PEINTURE = [peintureMurs];
