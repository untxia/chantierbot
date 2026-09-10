export type TradeId = 'general' | 'plombier' | 'paysagiste' | 'macon' | 'electricien' | 'peintre' | 'carreleur' | 'couvreur' | 'charpentier';

export interface TradeProfile {
	id: TradeId;
	label: string;
	focus: string[];
	units: string[];
}

export const TRADE_PROFILES: Record<TradeId, TradeProfile> = {
	general: { id: 'general', label: 'Bâtiment général', focus: ['travaux visibles', 'matériaux', 'surfaces', 'état du chantier'], units: ['m²', 'ml', 'u', 'h'] },
	plombier: { id: 'plombier', label: 'Plomberie', focus: ['canalisations', 'raccords', 'appareils sanitaires', 'fuites visibles'], units: ['ml', 'u', 'h'] },
	paysagiste: { id: 'paysagiste', label: 'Paysagiste', focus: ['surfaces extérieures', 'terrassement', 'plantations', 'bordures'], units: ['m²', 'ml', 'u', 'h'] },
	macon: { id: 'macon', label: 'Maçon', focus: ['maçonnerie', 'enduits', 'démolition', 'ouvertures'], units: ['m²', 'm³', 'ml', 'u', 'h'] },
	electricien: { id: 'electricien', label: 'Électricité', focus: ['tableau', 'câblage', 'prises', 'éclairage', 'gaines'], units: ['ml', 'u', 'h'] },
	peintre: { id: 'peintre', label: 'Peintre', focus: ['murs', 'plafonds', 'préparation', 'sous-couche', 'couches de finition'], units: ['m²', 'l', 'u', 'h'] },
	carreleur: { id: 'carreleur', label: 'Carreleur', focus: ['surface carrelée', 'dépose', 'colle', 'joints', 'plinthes'], units: ['m²', 'ml', 'kg', 'u', 'h'] },
	couvreur: { id: 'couvreur', label: 'Couvreur', focus: ['surface de toiture', 'tuiles/ardoises', 'faîtage', 'rives', 'gouttières', 'étanchéité'], units: ['m²', 'ml', 'u', 'h'] },
	charpentier: { id: 'charpentier', label: 'Charpentier', focus: ['pannes', 'chevrons', 'fermes', 'assemblages', 'bois visibles', 'contreventement'], units: ['m³', 'ml', 'u', 'h'] }
};

export function getTradeProfile(id?: string | null): TradeProfile {
	return TRADE_PROFILES[(id as TradeId) || 'general'] ?? TRADE_PROFILES.general;
}
