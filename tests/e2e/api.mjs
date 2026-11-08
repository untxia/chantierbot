// Tests de bout en bout par l'API (serveur local + vraie base, compte de test).
// Crée des données préfixées « ZZ e2e », les vérifie, puis les supprime.
import { client, ok, bilan, serveurDisponible, EMAIL, MOT_DE_PASSE, jourParis } from './outils.mjs';

await serveurDisponible();
const api = client();
ok('connexion', (await api('POST', '/api/auth/login', { email: EMAIL, password: MOT_DE_PASSE })).status === 200);

const hier = jourParis(new Date(Date.now() - 86400e3));
const demain = jourParis(new Date(Date.now() + 86400e3));
const ids = {};
try {
	ids.chantier = (await api('POST', '/api/chantiers', { name: 'ZZ e2e Dupont' })).json?.chantier?.id;
	ids.client = (await api('POST', '/api/clients', { name: 'ZZ e2e client' })).json?.client?.id;
	ids.relance = (await api('POST', '/api/relances', { title: 'ZZ e2e relance', type: 'client', due_date: hier, priority: 'haute' })).json?.relance?.id;
	ids.rdv = (await api('POST', '/api/planning', { title: 'ZZ e2e visite', start_at: new Date(`${demain}T09:00:00+01:00`).toISOString(), end_at: new Date(`${demain}T10:00:00+01:00`).toISOString(), type: 'client' })).json?.rendez_vous?.id;
	ids.fournisseur = (await api('POST', '/api/fournisseurs', { name: 'ZZ e2e négoce' })).json?.fournisseur?.id;
	ids.commande = (await api('POST', '/api/commandes', { fournisseur_id: ids.fournisseur, notes: 'ZZ e2e commande', lignes: [{ designation: 'ZZ colle', quantity: 8, unit_price_ht: 18.5 }] })).json?.commande?.id;
	ids.mesure = (await api('POST', '/api/mesures', { kind: 'surface', value: 18.4, method: 'photo', label: 'ZZ e2e cuisine', chantier_id: ids.chantier })).json?.mesure?.id;
	ok('données de test créées', Object.values(ids).every(Boolean), JSON.stringify(ids));

	// Assistant
	const dire = async (texte) => (await api('POST', '/api/assistant', { texte })).json ?? {};
	let r = await dire('Carrelage 25 m² en 60x60 avec ragréage 3 mm');
	ok('assistant : métré carrelage (8 sacs de colle)', r.details?.some((d) => d.startsWith('Mortier-colle C2 : 8 × sac de 25 kg')));
	r = await dire('Cloison placo 4 m x 2,5 m');
	ok('assistant : cloison (7 plaques)', r.details?.some((d) => d.startsWith('Plaques BA13 (1,20 × 2,50 m) : 7 ×')));
	r = await dire('Haie de 30 m sur deux rangs');
	ok('assistant : haie (108 plants)', r.details?.some((d) => d.startsWith('Plants de haie : 108')));
	r = await dire('Quelles relances sont en retard ?');
	ok('assistant : relance en retard', r.details?.some((d) => d.startsWith('ZZ e2e relance')), r.reponse);
	r = await dire('Mes rendez-vous de demain');
	ok('assistant : rendez-vous de demain à 09:00', r.details?.some((d) => d.includes('09:00') && d.includes('ZZ e2e visite')));
	r = await dire('Où en sont mes commandes ?');
	ok('assistant : commande 148 € HT', r.details?.some((d) => d.includes('ZZ e2e négoce') && d.includes('148')));
	r = await dire('Où en est le chantier e2e Dupont ?');
	ok('assistant : chantier trouvé', r.liens?.[0]?.href === `/chantiers/${ids.chantier}`, r.reponse);

	// Pages et API : uniquement les données de l'utilisateur
	for (const [page, attendu] of [['/projets', 'ZZ e2e Dupont'], [`/chantiers/${ids.chantier}`, 'ZZ e2e cuisine'], ['/mesures', 'ZZ e2e cuisine'], ['/metre', 'ZZ e2e Dupont'], ['/planning', 'ZZ e2e Dupont']]) {
		const p = await api('GET', page);
		ok(`page ${page}`, p.status === 200 && p.text.includes(attendu), `HTTP ${p.status}`);
	}
	ok('API clients', (await api('GET', '/api/clients')).json?.clients?.some((c) => c.name === 'ZZ e2e client'));
	ok('API relances', (await api('GET', '/api/relances')).json?.relances?.some((c) => c.title === 'ZZ e2e relance'));
	ok('API commandes (avec lignes)', (await api('GET', '/api/commandes')).json?.commandes?.some((c) => c.notes === 'ZZ e2e commande' && c.lignes.length === 1));
	ok('recherche clients protégée contre les filtres', (await api('GET', '/api/clients?q=' + encodeURIComponent('e2e,user_id.neq.x)'))).status === 200);
	ok('chantier inconnu : 404', (await api('GET', '/chantiers/00000000-0000-0000-0000-000000000000')).status === 404);

	// Export RGPD et garde-fous de suppression (sans supprimer)
	const ex = await api('GET', '/api/account/export');
	ok('export RGPD', ex.status === 200 && ex.json?.format === 'chantierbot-export-v1' && ex.json.chantiers.some((c) => c.name === 'ZZ e2e Dupont'));
	ok('suppression refusée sans confirmation', (await api('POST', '/api/account/delete', {})).status === 400);

	// Tarifs (si la migration est appliquée)
	const t = await api('GET', '/api/tarifs');
	if (t.status === 200) {
		const imp = await api('POST', '/api/tarifs', { fournisseur: 'ZZ e2e tarif', date_tarif: jourParis(new Date()), lignes: [{ designation: 'ZZ colle C2 25 kg', reference: 'ZZ1', unite: 'sac', prix_ht: 18.5, tva: 20 }] });
		ids.tarif = imp.json?.tarif?.id;
		ok('tarifs : import', imp.status === 201 && !!ids.tarif);
		const rech = await api('GET', '/api/tarifs/recherche?q=' + encodeURIComponent('ZZ colle'));
		const ligne = rech.json?.lignes?.[0];
		ok('tarifs : recherche', ligne?.designation === 'ZZ colle C2 25 kg' && Number(ligne.prix_ht) === 18.5);
		ok('tarifs : liaison au métré', (await api('POST', '/api/tarifs/associations', { code_fourniture: 'colle-c2|sac de 25 kg', tarif_ligne_id: ligne?.id })).status === 200);
		const m = await api('GET', '/metre?ouvrage=carrelage-sol&surface=25');
		ok('tarifs : prix repris dans le métré', m.text.includes('Tarif ZZ e2e tarif'));
		await api('DELETE', '/api/tarifs/associations', { code_fourniture: 'colle-c2|sac de 25 kg' });
	} else {
		console.log('(tarifs non testés : migration 20261108_tarifs_fournisseurs.sql pas encore appliquée)');
	}
} finally {
	// Nettoyage, même en cas d'échec
	if (ids.tarif) await api('DELETE', '/api/tarifs', { id: ids.tarif });
	if (ids.mesure) await api('DELETE', '/api/mesures', { id: ids.mesure });
	if (ids.commande) await api('DELETE', '/api/commandes', { id: ids.commande });
	if (ids.fournisseur) await api('DELETE', '/api/fournisseurs', { id: ids.fournisseur });
	if (ids.relance) await api('DELETE', '/api/relances', { id: ids.relance });
	if (ids.rdv) await api('DELETE', '/api/planning', { id: ids.rdv });
	if (ids.client) await api('DELETE', `/api/clients/${ids.client}`);
	if (ids.chantier) await api('DELETE', `/api/chantiers/${ids.chantier}`);
	const reste = await api('GET', '/projets');
	ok('nettoyage : plus de données de test', !reste.text.includes('ZZ e2e'));
}
bilan();
