import type { Source } from './types';

/**
 * Fiches techniques de fabricants d'où viennent les règles de consommation.
 * Les règles changent peu ; les PRIX, eux, ne sont volontairement pas dans la bibliothèque
 * (ils varient et dépendent du fournisseur de chaque artisan).
 */
export const SOURCES: Record<string, Source> = {
	'colle-castorama': {
		id: 'colle-castorama',
		titre: 'Colle carrelage Flex C2 — fiche technique (simple / double encollage selon format)',
		url: 'https://media.castorama.fr/is/content/Castorama/3454974425692_ran_fr_cfpdf'
	},
	'colle-bostik': {
		id: 'colle-bostik',
		titre: 'Bostik colle carrelage flex C2T — fiche technique',
		url: 'https://diy.bostik.com/sites/default/files/2025-01/Bostik-diy-France-colle-carrelage-flex-standard-c2T-tds.pdf'
	},
	'colle-samse': {
		id: 'colle-samse',
		titre: 'Colle C2 améliorée — consommation selon surface du carreau (Samse, fiche 1858168)',
		url: 'https://medias.groupe-samse.fr/Fiche_technique/Fiche_technique_1858168.pdf'
	},
	'joint-vicat': {
		id: 'joint-vicat',
		titre: 'Joint carrelage — formule de consommation (VPI / Vicat)',
		url: 'https://www.vpi.vicat.fr/content/download/48395/448869/version/10/file/FT+JOINT+FIN+PREMIUM+V650_06.2026.pdf'
	},
	'ragreage-mapei': {
		id: 'ragreage-mapei',
		titre: 'Ragréage sol intérieur — 1,5 kg/m²/mm (Mapei)',
		url: 'https://www.mapei.com/fr-diy/fr-fr/nos-produits/gamme-carrelage/ragreage-sol-interieur'
	},
	'ragreage-prb': {
		id: 'ragreage-prb',
		titre: 'PRB Ragréage Pro R&D — fiche technique (1,6 kg/m²/mm)',
		url: 'https://pim.prb.fr/PRB/Fiches%20Techniques/fr/ft_prb_ragreage_pro_rd_fr_12_04_2024.pdf'
	},
	'peinture-zolpan': {
		id: 'peinture-zolpan',
		titre: 'Zolpan Hydracryl+ Mat — rendement 9 à 10 m²/L par couche',
		url: 'https://particuliers.zolpan.fr/download/fiche_technique/ZOL_A02DJ/1/Hydracryl%252B+Mat-fiche_technique.pdf'
	},
	'peinture-tollens': {
		id: 'peinture-tollens',
		titre: 'Tollens Stic Acryl Mat — fiche technique (rendement par couche)',
		url: 'https://www.tollens.com/download/fiche_technique/TBA_STACMA/1/Stic+Acryl+Mat-fiche_technique.pdf'
	},
	'cloison-placo': {
		id: 'cloison-placo',
		titre: 'Placo — L’Intégrale, cloisons distributives Placostil BA13',
		url: 'https://www.placo.fr/sites/mac3.placo.fr/files/files/forum/L%27Int%C3%A9grale%20Placo%202021-2022%20-%20%20Cloisons%20distributives%20Placostil%C2%AE%20BA13-%20BA15-%20BA18.pdf'
	},
	'cloison-samse': {
		id: 'cloison-samse',
		titre: 'Quantitatif cloison Placostil 72/48 par m² (Samse, fiche 36322)',
		url: 'https://medias.groupe-samse.fr/Fiche_technique/Fiche_technique_36322.pdf'
	},
	'gazon-compo': {
		id: 'gazon-compo',
		titre: 'Compo Expert — semences gazon : 25 à 40 g/m² (création), 15 à 30 g/m² (regarnissage)',
		url: 'https://compo-expert.com/sites/default/files/2025-01/Semences%20gazon_4%20pages_France_02%202025.pdf'
	},
	'haie-wallonie': {
		id: 'haie-wallonie',
		titre: 'Wallonie — réussir sa plantation de haie (plants espacés de 50 à 70 cm)',
		url: 'https://yesweplant.wallonie.be/files/Documents/Documentation/Fiche%20-%20r%c3%a9ussir%20et%20entretenir%20sa%20plantation%20de%20haie.pdf'
	},
	'haie-aura': {
		id: 'haie-aura',
		titre: 'Référentiel AURA — paillage 15 à 20 cm sur 50 cm de part et d’autre de la haie',
		url: 'https://www.biodiversite-auvergne-rhone-alpes.fr/wp-content/uploads/2024/12/referentiel-photos-reception-et-suivi-plantation-de-haies-.pdf'
	},
	'primaire-bostik': {
		id: 'primaire-bostik',
		titre: 'Bostik Primacryl — primaire, 100 à 150 g/m² par couche',
		url: 'https://www.bostik.com/files/live/sites/shared_bostik/files/document/France/technical_data_sheets/BOSTIK_FR_FICHE_TECHNIQUE_PRIMACRYL_30047881_TDS_2020.pdf'
	}
};
