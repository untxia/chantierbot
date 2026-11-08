/**
 * Assistant ChantierBot — compréhension de la demande SANS IA externe.
 * Règles de mots-clés + extraction de nombres (surface, format, épaisseur).
 * Fonction pure : testable hors navigateur (assistant.test.ts).
 */

export type Intention =
	| { type: 'metre'; ouvrage: string; params: Record<string, number | string> }
	| { type: 'relances'; retardSeulement: boolean }
	| { type: 'planning'; periode: 'aujourdhui' | 'demain' | 'semaine' }
	| { type: 'commandes' }
	| { type: 'chantier'; recherche: string }
	| { type: 'chantiers' }
	| { type: 'stock' }
	| { type: 'mesure' }
	| { type: 'aide' };

/** Minuscules, sans accents, espaces simplifiés ; « m² » devient « m2 ». */
export function normaliser(texte: string): string {
	return texte
		.toLowerCase()
		.replace(/²/g, '2')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[’']/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

const nombreFr = (s: string) => Number(s.replace(',', '.'));
const contient = (t: string, mots: string[]) => mots.some((m) => new RegExp(`(^|[^a-z])${m}`).test(t));

/** Surface en m² : « 25 m2 », « 12,5 m 2 », « 30 metres carres ». */
export function extraireSurface(t: string): number | null {
	const m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:m\s?2|metres? carres?|mcarres?)(?![a-z0-9])/);
	return m ? nombreFr(m[1]) : null;
}

/** Format de carreau en cm : « 60x60 », « 30 x 60 », « 45*45 ». */
export function extraireFormat(t: string): { longueur: number; largeur: number } | null {
	const m = t.match(/(\d{1,3}(?:[.,]\d)?)\s*[x×*]\s*(\d{1,3}(?:[.,]\d)?)(?:\s*cm)?/);
	if (!m) return null;
	const a = nombreFr(m[1]);
	const b = nombreFr(m[2]);
	return a > 0 && b > 0 ? { longueur: a, largeur: b } : null;
}

/** Épaisseur en mm : « 3 mm », « 5mm ». */
export function extraireMm(t: string): number | null {
	const m = t.match(/(\d+(?:[.,]\d+)?)\s*mm(?![a-z])/);
	return m ? nombreFr(m[1]) : null;
}

/** Longueur en mètres : « 30 m », « 12,5 ml », « 4 metres » (pas « m2 »). */
export function extraireMetres(t: string): number | null {
	const m = t.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|m|metres?|metres? lineaires?)(?![a-z0-9])/);
	return m ? nombreFr(m[1]) : null;
}

export function interpreter(texteBrut: string): Intention {
	const t = normaliser(texteBrut);
	if (!t) return { type: 'aide' };

	// 0. Autres métiers de la bibliothèque : peinture, cloison, gazon, haie.
	if (contient(t, ['peindre', 'peinture', 'repeindre'])) {
		const params: Record<string, number | string> = {};
		const surface = extraireSurface(t);
		if (surface !== null) params.surface = surface;
		const couches = t.match(/(\d)\s*couches?/);
		if (couches) params.couches = Number(couches[1]);
		return { type: 'metre', ouvrage: 'peinture-murs', params };
	}
	if (contient(t, ['cloison', 'placo', 'plaque de platre', 'plaques de platre', 'ba13'])) {
		const params: Record<string, number | string> = {};
		const dims = t.match(/(\d+(?:[.,]\d+)?)\s*m?\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*m?(?![a-z0-9])/);
		if (dims) {
			params.longueur = nombreFr(dims[1]);
			params.hauteur = nombreFr(dims[2]);
		} else {
			const longueur = extraireMetres(t);
			if (longueur !== null) params.longueur = longueur;
		}
		return { type: 'metre', ouvrage: 'cloison-72-48', params };
	}
	if (contient(t, ['gazon', 'pelouse', 'semis', 'semer', 'engazonn'])) {
		const params: Record<string, number | string> = {};
		const surface = extraireSurface(t);
		if (surface !== null) params.surface = surface;
		if (contient(t, ['regarn'])) params.travaux = 'regarnissage';
		return { type: 'metre', ouvrage: 'semis-gazon', params };
	}
	if (contient(t, ['haie'])) {
		const params: Record<string, number | string> = {};
		const longueur = extraireMetres(t);
		if (longueur !== null) params.longueur = longueur;
		if (contient(t, ['2 rangs', 'deux rangs', 'double rang'])) params.rangs = '2';
		return { type: 'metre', ouvrage: 'plantation-haie', params };
	}

	// 1. Métré : la demande parle de carrelage, faïence, ragréage ou de quantités de fournitures.
	const motsMetre = ['carrel', 'carreau', 'faience', 'ragreage', 'ragreer', 'colle', 'joint', 'fourniture', 'metre ', 'metrer', 'combien de sac', 'combien de carton'];
	if (contient(t, motsMetre)) {
		const params: Record<string, number | string> = {};
		const surface = extraireSurface(t);
		if (surface !== null) params.surface = surface;
		const format = extraireFormat(t);
		if (format) Object.assign(params, format);
		const mm = extraireMm(t);
		if (contient(t, ['diagonale'])) params.pose = 'diagonale';
		else if (contient(t, ['decale', 'joints? perdus'])) params.pose = 'decalee';

		const faience = contient(t, ['faience', 'mural', 'murale', 'mur ', 'murs ', 'credence']);
		const carrelage = contient(t, ['carrel', 'carreau']);
		const ragreage = contient(t, ['ragreage', 'ragreer']);

		if (ragreage && !carrelage && !faience) {
			if (mm !== null) params.ragreage = mm;
			return { type: 'metre', ouvrage: 'ragreage-sol', params };
		}
		if (faience) return { type: 'metre', ouvrage: 'faience-murale', params };
		if (ragreage && mm !== null) params.ragreage = mm;
		return { type: 'metre', ouvrage: 'carrelage-sol', params };
	}

	// 2. Relances
	if (contient(t, ['relance', 'relancer', 'rappeler'])) {
		return { type: 'relances', retardSeulement: contient(t, ['retard', 'en retard', 'depasse', 'urgent']) };
	}

	// 3. Planning
	if (contient(t, ['rendez', 'rdv', 'planning', 'agenda', 'intervention', 'programme'])) {
		const periode = contient(t, ['demain']) ? 'demain' : contient(t, ['semaine', 'prochains jours']) ? 'semaine' : 'aujourdhui';
		return { type: 'planning', periode };
	}

	// 4. Commandes / livraisons
	if (contient(t, ['commande', 'livraison', 'livre', 'fournisseur'])) return { type: 'commandes' };

	// 5. Stock
	if (contient(t, ['stock', 'rupture', 'manque'])) return { type: 'stock' };

	// 6. Mesure
	if (contient(t, ['mesurer', 'mesure', 'realite augmentee', 'longueur', 'surface'])) return { type: 'mesure' };

	// 7. Un chantier précis : « chantier Dupont », « où en est le chantier de la rue des Lilas »
	const m = t.match(/chantier(?:s)?\s+(?:de la |de l |du |des |de |d |le |la |les )?(.+)$/);
	if (m) {
		const recherche = m[1].replace(/\b(svp|stp|s il te plait|s il vous plait)\b/g, '').replace(/[?!.]+$/, '').trim();
		const generique = /^(en cours|actifs?|actuels?|du moment|ouverts?|termines?)$/.test(recherche);
		if (recherche && !generique) return { type: 'chantier', recherche };
	}
	if (contient(t, ['chantier', 'projet'])) return { type: 'chantiers' };

	return { type: 'aide' };
}
