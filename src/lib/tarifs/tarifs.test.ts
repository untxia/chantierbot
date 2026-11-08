/** Tests de l'import de tarif fournisseur (npm run test:tarifs). */
import { lireCsv, nombre, taux, detecterColonnes, trouverEntete, versLignes, ttc, ageJours } from './import';

let echecs = 0;
function verifier(nom: string, ok: boolean, detail = '') {
	if (!ok) echecs++;
	console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ` — ${detail}` : ''}`);
}
const json = (x: unknown) => JSON.stringify(x);

// Nombres et taux
verifier('« 1 234,56 € » = 1234.56', nombre('1 234,56 €') === 1234.56);
verifier('« 18,50 €HT » = 18.5', nombre('18,50 €HT') === 18.5);
verifier('« 1.234,56 » = 1234.56', nombre('1.234,56') === 1234.56);
verifier('« 1,234.56 » = 1234.56', nombre('1,234.56') === 1234.56);
verifier('nombre Excel 32 = 32', nombre(32) === 32);
verifier('« abc » illisible', nombre('abc') === null);
verifier('taux « 20 % » = 20', taux('20 %') === 20);
verifier('taux 0,055 = 5.5', taux('0,055') === 5.5);
verifier('taux 10 = 10', taux(10) === 10);

// CSV : séparateur ; , tabulation, guillemets, BOM
const csv = '﻿Référence;Désignation;Unité;Prix HT;TVA\n123;"Colle C2 ""flex"" 25 kg";sac;18,50;20\n456;Joint gris 5 kg;sac;12,9;20\n\n';
const lu = lireCsv(csv);
verifier('CSV : 3 lignes, BOM retiré', lu.length === 3 && lu[0][0] === 'Référence', json(lu[0]));
verifier('CSV : guillemets doublés', lu[1][1] === 'Colle C2 "flex" 25 kg', lu[1][1]);
verifier('CSV virgule', lireCsv('a,b,c\n1,2,3')[1].length === 3);
verifier('CSV tabulation', lireCsv('a\tb\n1\t2')[1][1] === '2');

// Reconnaissance des colonnes
const c1 = detecterColonnes(['Référence', 'Désignation', 'Unité', 'Prix HT', 'TVA']);
verifier('colonnes standard', json(c1) === json({ designation: 1, reference: 0, unite: 2, prixHT: 3, prixTTC: -1, tva: 4 }), json(c1));
const c2 = detecterColonnes(['Code article', 'Libellé', 'UV', 'PU net', 'Prix TTC']);
verifier('variantes : libellé / PU net / TTC', c2.designation === 1 && c2.reference === 0 && c2.unite === 2 && c2.prixHT === 3 && c2.prixTTC === 4, json(c2));
const c3 = detecterColonnes(['Article', 'Prix TTC']);
verifier('seulement TTC', c3.designation === 0 && c3.prixTTC === 1 && c3.prixHT === -1, json(c3));
const c4 = detecterColonnes(['Désignation', 'Remise %', 'Prix net HT']);
verifier('la remise n’est pas prise pour le prix', c4.prixHT === 2, json(c4));

// En-tête après des lignes de titre
const feuille = [['TARIF PRO 2026', null], ['Client : Dupont', null], ['Désignation', 'Prix HT'], ['Ciment 35 kg', 9.8]];
const e = trouverEntete(feuille);
verifier('en-tête trouvé en ligne 3', e?.index === 2);

// Conversion
const r = versLignes(lu.slice(1), c1);
verifier('2 lignes importées', r.lignes.length === 2 && r.erreurs.length === 0);
verifier('colle : 18,50 HT, TVA 20', r.lignes[0].prix_ht === 18.5 && r.lignes[0].tva === 20 && r.lignes[0].reference === '123' && r.lignes[0].unite === 'sac');
const rTtc = versLignes([['Peinture 10 L', '120,00']], { designation: 0, reference: -1, unite: -1, prixHT: -1, prixTTC: 1, tva: -1 });
verifier('TTC seul : 120 TTC → 100 HT (TVA 20 par défaut)', rTtc.lignes[0].prix_ht === 100 && rTtc.lignes[0].tva === 20);
const rErr = versLignes([['', '5'], ['Sable', 'gratuit'], ['Gravier', '3,2']], { designation: 0, reference: -1, unite: -1, prixHT: 1, prixTTC: -1, tva: -1 });
verifier('erreurs signalées avec numéro de ligne', rErr.lignes.length === 1 && rErr.erreurs.length === 2 && rErr.erreurs[0].ligne === 2, json(rErr.erreurs));
verifier('TTC : 18,50 HT à 20 % = 22,20', ttc(18.5, 20) === 22.2);
verifier('TTC : 100 HT à 5,5 % = 105,50', ttc(100, 5.5) === 105.5);
verifier('âge : 100 jours', ageJours('2026-08-01', new Date('2026-11-09T12:00:00')) === 100);

console.log(echecs === 0 ? '\nTous les tests passent.' : `\n${echecs} test(s) en échec.`);
if (echecs > 0) process.exit(1);
