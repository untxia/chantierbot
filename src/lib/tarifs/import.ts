/**
 * Import d'un tarif fournisseur (CSV ou Excel exporté du compte pro de l'artisan).
 * Fonctions pures : lecture CSV, reconnaissance des colonnes, conversion en lignes HT / TVA.
 */

export type Cellule = string | number | boolean | Date | null;

export interface Colonnes {
	designation: number;
	reference: number;
	unite: number;
	prixHT: number;
	prixTTC: number;
	tva: number;
}

export interface LigneTarif {
	reference: string | null;
	designation: string;
	unite: string | null;
	prix_ht: number;
	tva: number;
}

export interface ResultatImport {
	lignes: LigneTarif[];
	erreurs: { ligne: number; raison: string }[];
}

export const TVA_DEFAUT = 20;
export const MAX_LIGNES = 20000;
/** Au-delà, l'application invite à importer le nouveau tarif. */
export const AGE_MAX_JOURS = 90;

const sansAccents = (s: string) =>
	s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9%]+/g, ' ')
		.trim();

/** Lit un CSV (séparateur ; , ou tabulation détecté, guillemets gérés, BOM retiré). */
export function lireCsv(texte: string): string[][] {
	const t = texte.replace(/^﻿/, '');
	const premiere = t.split(/\r?\n/, 1)[0] ?? '';
	const candidats = [';', '\t', ','];
	const sep = candidats.reduce((best, c) => (premiere.split(c).length > premiere.split(best).length ? c : best), ';');

	const lignes: string[][] = [];
	let ligne: string[] = [];
	let champ = '';
	let entreGuillemets = false;
	for (let i = 0; i < t.length; i++) {
		const c = t[i];
		if (entreGuillemets) {
			if (c === '"') {
				if (t[i + 1] === '"') {
					champ += '"';
					i++;
				} else entreGuillemets = false;
			} else champ += c;
		} else if (c === '"') entreGuillemets = true;
		else if (c === sep) {
			ligne.push(champ);
			champ = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && t[i + 1] === '\n') i++;
			ligne.push(champ);
			lignes.push(ligne);
			ligne = [];
			champ = '';
		} else champ += c;
	}
	if (champ !== '' || ligne.length > 0) {
		ligne.push(champ);
		lignes.push(ligne);
	}
	return lignes.filter((l) => l.some((c) => c.trim() !== ''));
}

/** « 1 234,56 € », « 12.5 », « 18,50 €HT » → nombre ; sinon null. */
export function nombre(v: Cellule): number | null {
	if (typeof v === 'number') return Number.isFinite(v) ? v : null;
	if (typeof v !== 'string') return null;
	let s = v.replace(/[\s  €]|ht|ttc/gi, '');
	if (!s) return null;
	if (s.includes(',') && s.includes('.')) {
		// « 1.234,56 » (point = milliers) ou « 1,234.56 » (virgule = milliers)
		s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
	} else s = s.replace(',', '.');
	if (!/^-?\d+(\.\d+)?%?$/.test(s)) return null;
	return Number(s.replace('%', ''));
}

/** Taux de TVA : « 20 », « 20 % », « 0,2 » → 20. */
export function taux(v: Cellule): number | null {
	const n = nombre(v);
	if (n === null || n < 0) return null;
	const pct = n > 0 && n < 1 ? n * 100 : n;
	return pct <= 100 ? Math.round(pct * 100) / 100 : null;
}

const REGLES: [keyof Colonnes, RegExp, RegExp?][] = [
	['prixTTC', /ttc/],
	['tva', /\b(tva|taux)\b/],
	['prixHT', /(prix|pu|tarif|montant|net).*(ht|net|unitaire)|^(ht|prix|tarif|prix net|pu|pvht|prix vente)$|\bht\b/, /ttc|tva|remise|%/],
	['reference', /^(ref|reference|code|sku|ean|gencod|code article|ref article|reference article|ref fournisseur)\b/],
	['unite', /^(unite|uv|udv|u v|conditionnement|cond|unite de vente)\b/],
	['designation', /designation|libelle|article|produit|description|intitule|^nom\b/, /code|ref/]
];

/** Reconnaît les colonnes à partir de la ligne d'en-tête (-1 = absente). */
export function detecterColonnes(entetes: Cellule[]): Colonnes {
	const col: Colonnes = { designation: -1, reference: -1, unite: -1, prixHT: -1, prixTTC: -1, tva: -1 };
	const noms = entetes.map((e) => sansAccents(String(e ?? '')));
	for (const [cle, motif, exclusion] of REGLES) {
		const i = noms.findIndex((n, idx) => n && motif.test(n) && !(exclusion && exclusion.test(n)) && !Object.values(col).includes(idx));
		if (i >= 0) col[cle] = i;
	}
	return col;
}

/** Cherche la ligne d'en-tête dans les 15 premières lignes (désignation + un prix). */
export function trouverEntete(lignes: Cellule[][]): { index: number; colonnes: Colonnes } | null {
	for (let i = 0; i < Math.min(15, lignes.length); i++) {
		const c = detecterColonnes(lignes[i]);
		if (c.designation >= 0 && (c.prixHT >= 0 || c.prixTTC >= 0)) return { index: i, colonnes: c };
	}
	return null;
}

/** Convertit les lignes de données en lignes de tarif HT + TVA. */
export function versLignes(donnees: Cellule[][], col: Colonnes, tvaDefaut = TVA_DEFAUT, premiereLigne = 2): ResultatImport {
	const lignes: LigneTarif[] = [];
	const erreurs: { ligne: number; raison: string }[] = [];
	const cell = (r: Cellule[], i: number) => (i >= 0 ? r[i] ?? null : null);
	const texteCell = (r: Cellule[], i: number) => {
		const v = cell(r, i);
		const s = v === null ? '' : String(v).trim();
		return s || null;
	};

	donnees.forEach((r, k) => {
		const numero = premiereLigne + k;
		if (!r.some((v) => v !== null && String(v).trim() !== '')) return;
		const designation = texteCell(r, col.designation);
		if (!designation) {
			erreurs.push({ ligne: numero, raison: 'désignation vide' });
			return;
		}
		const tva = taux(cell(r, col.tva)) ?? tvaDefaut;
		let ht = nombre(cell(r, col.prixHT));
		if (ht === null) {
			const ttc = nombre(cell(r, col.prixTTC));
			if (ttc !== null) ht = ttc / (1 + tva / 100);
		}
		if (ht === null || ht < 0) {
			erreurs.push({ ligne: numero, raison: 'prix manquant ou illisible' });
			return;
		}
		if (lignes.length >= MAX_LIGNES) {
			erreurs.push({ ligne: numero, raison: `au-delà de ${MAX_LIGNES} lignes` });
			return;
		}
		lignes.push({
			reference: texteCell(r, col.reference)?.slice(0, 80) ?? null,
			designation: designation.slice(0, 300),
			unite: texteCell(r, col.unite)?.slice(0, 40) ?? null,
			prix_ht: Math.round(ht * 10000) / 10000,
			tva
		});
	});
	return { lignes, erreurs };
}

export const ttc = (ht: number, tva: number) => Math.round(ht * (1 + tva / 100) * 100) / 100;

/** Âge d'un tarif en jours (date du tarif, sinon date d'import). */
export function ageJours(dateIso: string, maintenant = new Date()): number {
	const d = new Date(dateIso.length === 10 ? `${dateIso}T12:00:00` : dateIso);
	return Math.floor((maintenant.getTime() - d.getTime()) / 86400000);
}
