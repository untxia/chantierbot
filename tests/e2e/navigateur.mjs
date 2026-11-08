// Parcours réel dans Chrome (playwright-core + Chrome installé) : connexion, assistant,
// métré chiffré, devis avec TVA, autres métiers, mobile. Captures dans tests/e2e/captures/.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { ok, bilan, serveurDisponible, BASE, EMAIL, MOT_DE_PASSE, CHROME, CAPTURES } from './outils.mjs';

await serveurDisponible();
mkdirSync(CAPTURES, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'fr-FR' });
const page = await ctx.newPage();
const erreursJs = [];
page.on('pageerror', (e) => erreursJs.push(e.message));
page.on('dialog', (d) => d.accept());

try {
	// Connexion : attendre l'hydratation avant de remplir, navigation côté client ensuite
	await page.goto(`${BASE}/connexion`);
	await page.waitForLoadState('networkidle');
	await page.fill('#email', EMAIL);
	await page.fill('#password', MOT_DE_PASSE);
	await page.click('button[type="submit"]');
	await page.waitForURL(`${BASE}/`, { timeout: 20000, waitUntil: 'commit' });
	await page.waitForLoadState('networkidle');
	ok('connexion par le formulaire', true);
	const nav = page.locator('nav[aria-label="Navigation principale"]');
	ok('menu : Métré, Tarifs, Devis IA', (await nav.getByText('Métré', { exact: true }).count()) === 1 && (await nav.getByText('Tarifs', { exact: true }).count()) === 1 && (await nav.getByText('Devis IA', { exact: true }).count()) === 1);
	ok('menu : Administration masquée (compte non admin)', (await nav.getByText('Administration').count()) === 0);

	// Assistant
	await page.fill('input[placeholder^="Posez une question"]', 'Carrelage 25 m² en 60x60');
	await page.keyboard.press('Enter');
	await page.getByText('Mortier-colle C2 : 8 × sac de 25 kg').waitFor({ timeout: 15000 });
	ok('assistant : réponse affichée', true);
	await page.screenshot({ path: `${CAPTURES}/accueil-assistant.png` });

	// Métré chiffré
	await page.goto(`${BASE}/metre?ouvrage=carrelage-sol&surface=25&m2Carton=1.44`);
	await page.waitForLoadState('networkidle');
	await page.evaluate(() => ['chantierbot-prix-metre', 'chantierbot-mo-metre', 'chantierbot-draft-quote'].forEach((k) => localStorage.removeItem(k)));
	await page.reload();
	await page.waitForLoadState('networkidle');
	const saisir = async (label, valeur) => {
		const champ = page.getByLabel(label);
		if (await champ.isDisabled()) return; // prix venant d'un tarif importé
		await champ.fill(valeur);
		await champ.press('Tab');
	};
	await saisir('Prix HT de Mortier-colle C2', '18.5');
	await saisir('Prix HT de Carreaux 60 × 60 cm', '32');
	await saisir(/Prix HT de la main-d’œuvre/, '35');
	const total = (await page.locator('p.text-lg', { hasText: 'Total HT' }).innerText()).replace(/\s/g, ' ');
	ok('métré : total HT 1 663 €', /1\s?663,00/.test(total), total);
	await page.screenshot({ path: `${CAPTURES}/metre.png`, fullPage: true });
	await page.reload();
	await page.waitForLoadState('networkidle');
	ok('métré : prix mémorisés', (await page.getByLabel('Prix HT de Mortier-colle C2').inputValue()) === '18.5');

	// Devis avec TVA client
	await page.getByRole('button', { name: 'Créer le brouillon de devis' }).click();
	await page.waitForURL(`${BASE}/rapports`, { waitUntil: 'commit' });
	await page.getByText('Total TTC').waitFor();
	await page.selectOption('#tva-client', '10');
	const art = (await page.locator('article').innerText()).replace(/\s/g, ' ');
	ok('devis : TVA 10 % → TTC 1 829,30 €', /1\s?829,30/.test(art));
	await page.screenshot({ path: `${CAPTURES}/devis.png`, fullPage: true });

	// Autres métiers
	await page.goto(`${BASE}/metre`);
	await page.waitForLoadState('networkidle');
	await page.selectOption('#ouvrage', 'cloison-72-48');
	await page.fill('#longueur', '4');
	await page.fill('#hauteur', '2.5');
	await page.fill('#ouvertures', '1.7');
	await page.getByText('Plaques BA13 (1,20 × 2,50 m)').first().waitFor();
	ok('métré cloison : 8,3 m²', (await page.getByText(/Cloison 72\/48 .* — 8,3 m²/).count()) === 1);
	await page.selectOption('#ouvrage', 'plantation-haie');
	await page.fill('#longueur', '30');
	await page.getByText('Plants de haie').first().waitFor();
	ok('métré haie : main-d’œuvre par ml', (await page.getByText('€/ml').count()) === 1);

	// Pages diverses
	for (const p of ['/tarifs', '/parametres', '/confidentialite']) {
		await page.goto(`${BASE}${p}`);
		await page.waitForLoadState('networkidle');
		ok(`page ${p} affichée`, (await page.locator('h1').count()) >= 1);
	}

	// Mobile
	const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', storageState: await ctx.storageState() });
	const m = await mobile.newPage();
	m.on('pageerror', (e) => erreursJs.push(e.message));
	await m.goto(`${BASE}/metre?surface=12`);
	await m.waitForLoadState('networkidle');
	await m.screenshot({ path: `${CAPTURES}/metre-mobile.png`, fullPage: true });
	ok('mobile : page Métré affichée', (await m.getByText('Fournitures').count()) >= 1);
} finally {
	await page.evaluate(() => ['chantierbot-prix-metre', 'chantierbot-mo-metre', 'chantierbot-draft-quote'].forEach((k) => localStorage.removeItem(k))).catch(() => {});
	ok('aucune erreur JavaScript', erreursJs.length === 0, erreursJs.join(' | '));
	await browser.close();
}
bilan();
