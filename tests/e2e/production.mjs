// Vérification rapide de la production (lecture seule : aucune donnée créée).
// E2E_BASE_URL=https://chantierbot.vercel.app node tests/e2e/production.mjs
process.env.E2E_BASE_URL ||= 'https://chantierbot.vercel.app';
const { client, ok, bilan, BASE, EMAIL, MOT_DE_PASSE } = await import('./outils.mjs');

const api = client();
for (const p of ['/connexion', '/confidentialite', '/mentions-legales', '/conditions']) {
	const r = await fetch(BASE + p, { redirect: 'manual' });
	ok(`page publique ${p}`, r.status === 200, `HTTP ${r.status}`);
}
const protegee = await fetch(`${BASE}/metre`, { redirect: 'manual' });
ok('page protégée redirige vers la connexion', protegee.status === 303);
const k = await fetch(`${BASE}/api/cron/keepalive`);
ok('réveil Supabase', k.status === 200 || k.status === 401, `HTTP ${k.status}`);

ok('connexion', (await api('POST', '/api/auth/login', { email: EMAIL, password: MOT_DE_PASSE })).status === 200);
const r = await api('POST', '/api/assistant', { texte: 'Carrelage 25 m² en 60x60' });
ok('assistant', r.json?.details?.some((d) => d.startsWith('Mortier-colle C2 : 8 × sac de 25 kg')), r.json?.reponse);
for (const p of ['/', '/projets', '/metre', '/tarifs', '/mesures', '/planning', '/rapports', '/parametres']) {
	const x = await api('GET', p);
	ok(`page ${p}`, x.status === 200, `HTTP ${x.status}`);
}
bilan();
