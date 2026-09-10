export type TradeId =
	| 'general'
	| 'plombier'
	| 'paysagiste'
	| 'macon'
	| 'electricien'
	| 'peintre'
	| 'carreleur'
	| 'couvreur'
	| 'charpentier';

export type TradeProfile = {
	id: TradeId;
	label: string;
	subtitle: string;
	icon: string;
	analysis: string[];
	prompt: string;
};

export const tradeProfiles: Record<TradeId, TradeProfile> = {
	general: {
		id: 'general',
		label: 'Chantier',
		subtitle: 'Général',
		icon: '🏗️',
		analysis: ['travaux visibles', 'matériaux', 'état du chantier', 'points à vérifier'],
		prompt: 'Analyse la scène de chantier, identifie les travaux visibles, les matériaux, les équipements et les points à vérifier. Ne déduis pas une information technique non visible.'
	},
	plombier: {
		id: 'plombier',
		label: 'Plombier',
		subtitle: 'Plomberie',
		icon: '🔧',
		analysis: ['réseaux visibles', 'sanitaires', 'raccords', 'matériaux', 'main-d’œuvre'],
		prompt: 'Analyse le chantier de plomberie et relève les équipements, réseaux, raccords, longueurs ou surfaces estimables visuellement et travaux à prévoir. Signale les éléments impossibles à confirmer par photo.'
	},
	paysagiste: {
		id: 'paysagiste',
		label: 'Paysagiste',
		subtitle: 'Extérieurs',
		icon: '🌿',
		analysis: ['surfaces', 'végétation', 'terrassements', 'matériaux', 'évacuation'],
		prompt: 'Analyse l’aménagement extérieur : surfaces, végétation, terrassement, clôtures, revêtements et équipements visibles. Sépare clairement observation et estimation.'
	},
	macon: {
		id: 'macon',
		label: 'Maçon',
		subtitle: 'Gros œuvre',
		icon: '🧱',
		analysis: ['murs', 'ouvertures', 'béton', 'maçonnerie', 'quantités'],
		prompt: 'Analyse les travaux de maçonnerie visibles : murs, ouvertures, béton, blocs, enduits, démolition et préparation. Propose uniquement des estimations de quantités lorsque la photo permet une approximation raisonnable.'
	},
	electricien: {
		id: 'electricien',
		label: 'Électricien',
		subtitle: 'Électricité',
		icon: '⚡',
		analysis: ['tableau', 'prises', 'éclairage', 'câblage', 'appareillage'],
		prompt: 'Analyse le chantier électrique : tableau, câblage, prises, interrupteurs, luminaires et appareillage visibles. Ne conclus jamais à la conformité ou à la sécurité à partir d’une photo seule.'
	},
	peintre: {
		id: 'peintre',
		label: 'Peintre',
		subtitle: 'Peinture',
		icon: '🎨',
		analysis: ['murs et plafonds', 'préparation', 'sous-couche', 'nombre de couches', 'quantité de peinture'],
		prompt: 'Analyse un chantier de peinture : surfaces de murs et plafonds, préparation, rebouchage, ponçage, sous-couche, nombre de couches et quantité de peinture estimable. Distingue toujours observation et estimation.'
	},
	carreleur: {
		id: 'carreleur',
		label: 'Carreleur',
		subtitle: 'Carrelage',
		icon: '◻️',
		analysis: ['surface à carreler', 'dépose', 'ragréage', 'colle', 'joints', 'plinthes'],
		prompt: 'Analyse un chantier de carrelage : surfaces à carreler, ancien revêtement à déposer, préparation ou ragréage, format apparent des carreaux, colle, joints, plinthes et pertes. Ne donne pas de métrage certain sans mesure réelle.'
	},
	couvreur: {
		id: 'couvreur',
		label: 'Couvreur',
		subtitle: 'Toiture',
		icon: '🏠',
		analysis: ['couverture', 'tuiles ou ardoises', 'faîtage', 'rives', 'gouttières', 'isolation visible'],
		prompt: 'Analyse visuellement une toiture : couverture, tuiles ou ardoises, faîtage, rives, noues, gouttières et éléments visibles. Repère les zones potentiellement à contrôler mais ne pose aucun diagnostic de sécurité ou d’étanchéité à partir de la photo seule.'
	},
	charpentier: {
		id: 'charpentier',
		label: 'Charpentier',
		subtitle: 'Structure bois',
		icon: '🪵',
		analysis: ['pannes', 'chevrons', 'fermes', 'sections visibles', 'assemblages', 'état apparent du bois'],
		prompt: 'Analyse les éléments de charpente visibles : pannes, chevrons, fermes, poteaux, assemblages et état apparent du bois. N’infère jamais une section, une résistance ou une conformité structurelle sans mesure et validation professionnelle.'
	}
};
