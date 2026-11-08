// Outils communs des tests de bout en bout (sans dépendance hors playwright-core).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Charge .env.local (sans écraser les variables déjà définies). */
for (const fichier of ['.env.local', '.env']) {
	const chemin = join(racine, fichier);
	if (!existsSync(chemin)) continue;
	for (const ligne of readFileSync(chemin, 'utf8').split(/\r?\n/)) {
		const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
		if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
}

export const BASE = (process.env.E2E_BASE_URL || 'http://localhost:5199').replace(/\/$/, '');
export const EMAIL = process.env.E2E_EMAIL;
export const MOT_DE_PASSE = process.env.E2E_PASSWORD;
export const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const CAPTURES = join(racine, 'tests', 'e2e', 'captures');

if (!EMAIL || !MOT_DE_PASSE) {
	console.error('E2E_EMAIL et E2E_PASSWORD doivent être définis (dans .env.local) : compte de TEST uniquement.');
	process.exit(2);
}

let echecs = 0;
export function ok(nom, condition, detail = '') {
	if (!condition) echecs++;
	console.log(`${condition ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ` — ${detail}` : ''}`);
}
export function bilan() {
	console.log(echecs === 0 ? '\nTOUT EST OK' : `\n${echecs} ÉCHEC(S)`);
	process.exit(echecs === 0 ? 0 : 1);
}

/** Client HTTP avec cookie de session. */
export function client() {
	let cookie = '';
	return async function api(method, chemin, body) {
		const res = await fetch(BASE + chemin, {
			method,
			headers: { 'Content-Type': 'application/json', cookie },
			body: body === undefined ? undefined : JSON.stringify(body),
			redirect: 'manual'
		});
		const set = res.headers.getSetCookie?.() ?? [];
		if (set.length) cookie = set.map((c) => c.split(';')[0]).join('; ');
		const text = await res.text();
		let json = null;
		try {
			json = JSON.parse(text);
		} catch {
			/* page HTML */
		}
		return { status: res.status, json, text };
	};
}

/** Vérifie que le serveur répond avant de lancer les tests. */
export async function serveurDisponible() {
	try {
		const r = await fetch(`${BASE}/connexion`);
		if (r.ok) return;
		throw new Error(`HTTP ${r.status}`);
	} catch (e) {
		console.error(`Serveur injoignable sur ${BASE} (${e.message}). Lancez « npm run dev -- --port 5199 ».`);
		process.exit(2);
	}
}

export const jourParis = (d) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
