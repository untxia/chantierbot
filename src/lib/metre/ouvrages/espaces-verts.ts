import type { Ouvrage, ResultatMetre } from '../types';
import { arrondiSup, ligne, nf, nombre, texte } from '../outils';

/*
 * Espaces verts. Valeurs issues de fiches de semenciers et de guides de plantation de haies.
 * Couvre-sols : aucune densité fiable trouvée, volontairement absents (dépend de l'espèce).
 */

const SAC_SEMENCES_KG = 5;

export const semisGazon: Ouvrage = {
	code: 'semis-gazon',
	metier: 'paysagiste',
	designation: 'Semis de gazon',
	description: 'Semences selon la création ou le regarnissage, et terre végétale en option.',
	champs: [
		{ id: 'surface', label: 'Surface à semer', type: 'number', unite: 'm²', defaut: 0, min: 1, max: 100000, pas: 0.1, requis: true },
		{
			id: 'travaux',
			label: 'Travaux',
			type: 'select',
			defaut: 'creation',
			options: [
				{ valeur: 'creation', label: 'Création (35 g/m²)' },
				{ valeur: 'regarnissage', label: 'Regarnissage (20 g/m²)' }
			]
		},
		{ id: 'terre', label: 'Apport de terre végétale', type: 'number', unite: 'cm', defaut: 0, min: 0, max: 50, pas: 1, aide: '0 = pas d’apport.' }
	],
	calculer(p): ResultatMetre {
		const surface = nombre(p, 'surface', 'Surface', 1, 100000);
		const travaux = texte(p, 'travaux', ['creation', 'regarnissage'], 'creation');
		const dose = travaux === 'creation' ? 35 : 20;
		const terreCm = nombre(p, 'terre', 'Apport de terre', 0, 50);
		const lignes = [
			ligne({
				code: 'semences-gazon',
				designation: `Semences de gazon (${travaux === 'creation' ? 'création' : 'regarnissage'})`,
				quantite: (surface * dose) / 1000,
				unite: 'kg',
				perte: 0.1,
				contenance: SAC_SEMENCES_KG,
				conditionnement: `sac de ${SAC_SEMENCES_KG} kg`,
				calcul: `${nf(surface)} m² × ${dose} g/m² + 10 %`,
				sources: ['gazon-compo']
			})
		];
		if (terreCm > 0) {
			lignes.push(
				ligne({
					code: 'terre-vegetale',
					designation: `Terre végétale (${nf(terreCm, 0)} cm)`,
					quantite: surface * (terreCm / 100),
					unite: 'm³',
					perte: 0.15,
					calcul: `${nf(surface)} m² × ${nf(terreCm / 100)} m + 15 % (tassement)`,
					fiabilite: 'estimation'
				})
			);
		}
		return { ouvrage: this.designation, lignes, avertissements: ['Vérifiez la dose sur le sac : elle varie selon le mélange (25 à 40 g/m² en création).'] };
	}
};

export const plantationHaie: Ouvrage = {
	code: 'plantation-haie',
	metier: 'paysagiste',
	designation: 'Plantation de haie',
	description: 'Nombre de plants selon l’espacement et le nombre de rangs, et paillage.',
	champs: [
		{ id: 'longueur', label: 'Longueur de la haie', type: 'number', unite: 'ml', defaut: 0, min: 0.5, max: 10000, pas: 0.1, requis: true },
		{ id: 'espacement', label: 'Espacement entre plants', type: 'number', unite: 'cm', defaut: 60, min: 20, max: 300, pas: 5, aide: '50 à 70 cm pour une haie champêtre.' },
		{
			id: 'rangs',
			label: 'Nombre de rangs',
			type: 'select',
			defaut: '1',
			options: [
				{ valeur: '1', label: '1 rang' },
				{ valeur: '2', label: '2 rangs en quinconce' }
			]
		},
		{ id: 'paillage', label: 'Épaisseur de paillage', type: 'number', unite: 'cm', defaut: 15, min: 0, max: 30, pas: 1, aide: '15 à 20 cm conseillés. 0 = pas de paillage.' }
	],
	reference: (p) => ({ valeur: Number(p.longueur) || 0, unite: 'ml' }),
	calculer(p): ResultatMetre {
		const longueur = nombre(p, 'longueur', 'Longueur', 0.5, 10000);
		const espacement = nombre(p, 'espacement', 'Espacement', 20, 300) / 100;
		const rangs = Number(texte(p, 'rangs', ['1', '2'], '1'));
		const paillageCm = nombre(p, 'paillage', 'Paillage', 0, 30);
		const parRang = arrondiSup(longueur / espacement) + 1;
		const lignes = [
			ligne({
				code: 'plants-haie',
				designation: 'Plants de haie',
				quantite: parRang * rangs,
				unite: 'u',
				perte: 0.05,
				calcul: `(${nf(longueur)} m ÷ ${nf(espacement)} m arrondi + 1) = ${parRang} par rang × ${rangs} rang(s) + 5 % de remplacement`,
				sources: ['haie-wallonie']
			})
		];
		if (paillageCm > 0) {
			const largeur = rangs === 2 ? 1.5 : 1;
			lignes.push(
				ligne({
					code: 'paillage',
					designation: `Paillage (${nf(paillageCm, 0)} cm)`,
					quantite: longueur * largeur * (paillageCm / 100),
					unite: 'm³',
					perte: 0.1,
					calcul: `${nf(longueur)} m × ${nf(largeur)} m de large × ${nf(paillageCm / 100)} m + 10 %`,
					sources: ['haie-aura']
				})
			);
		}
		return { ouvrage: this.designation, lignes, avertissements: ['Choisissez des essences adaptées au sol et au climat ; plantez hors gel, de novembre à mars.'] };
	}
};

export const OUVRAGES_ESPACES_VERTS = [semisGazon, plantationHaie];
