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
	'primaire-bostik': {
		id: 'primaire-bostik',
		titre: 'Bostik Primacryl — primaire, 100 à 150 g/m² par couche',
		url: 'https://www.bostik.com/files/live/sites/shared_bostik/files/document/France/technical_data_sheets/BOSTIK_FR_FICHE_TECHNIQUE_PRIMACRYL_30047881_TDS_2020.pdf'
	}
};
