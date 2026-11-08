/**
 * Tests du moteur de métré (sans framework) :
 *   npx esbuild src/lib/metre/metre.test.ts --bundle --platform=node --outfile=<tmp>/metre.test.cjs && node <tmp>/metre.test.cjs
 * Les valeurs attendues sont calculées à la main à partir des règles des fiches techniques.
 */
import { calculer, chiffrer, clePrix, versBrouillonDevis, ErreurMetre, parametresParDefaut, pretACalculer, referenceDe, trouverOuvrage, OUVRAGES } from './index';
import { consommationJoint, consommationColle } from './ouvrages/carrelage';

let echecs = 0;
function verifier(nom: string, ok: boolean, detail = '') {
	if (!ok) echecs++;
	console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ` — ${detail}` : ''}`);
}
const proche = (a: number, b: number, tol = 1e-3) => Math.abs(a - b) <= tol;

// Formule du joint : exemple publié (30 × 60 cm, 9 mm, joint 3 mm) = 0,216 kg/m²
verifier('joint 30×60, 9 mm, 3 mm = 0,216 kg/m²', proche(consommationJoint(300, 600, 9, 3), 0.216));
verifier('joint 30×30, 8 mm, 3 mm = 0,256 kg/m²', proche(consommationJoint(300, 300, 8, 3), 0.256));

verifier('colle petit format (20×20) = 4 kg/m²', consommationColle(400).kgM2 === 4);
verifier('colle 40×40 = 6 kg/m²', consommationColle(1600).kgM2 === 6);
verifier('colle 60×60 = 7 kg/m²', consommationColle(3600).kgM2 === 7);

// Carrelage sol 25 m², 60×60, 1,44 m²/carton, périmètre 20 ml, 0,8 ml de porte, ragréage 3 mm
const o = trouverOuvrage('carrelage-sol')!;
const r = calculer(
	'carrelage-sol',
	parametresParDefaut(o, { surface: 25, m2Carton: 1.44, perimetre: 20, portes: 0.8, ragreage: 3 })
);
const L = (code: string) => r.lignes.find((x) => x.code === code)!;

verifier('carreaux 25 m² + 10 % = 27,5 m²', proche(L('carreaux').quantiteAvecPerte, 27.5));
verifier('cartons : 27,5 / 1,44 → 20', L('carreaux').achat?.nombre === 20, String(L('carreaux').achat?.nombre));
verifier('colle : 25 × 7 × 1,05 = 183,75 kg', proche(L('colle-c2').quantiteAvecPerte, 183.75));
verifier('colle : 8 sacs de 25 kg', L('colle-c2').achat?.nombre === 8);
// joint 60×60, 9 mm, 3 mm : (600+600)/(360000) × 9 × 3 × 1,6 = 0,144 kg/m² → × 25 × 1,1 = 3,96 kg → 1 sac
verifier('joint : 3,96 kg → 1 sac', proche(L('joint').quantiteAvecPerte, 3.96) && L('joint').achat?.nombre === 1);
verifier('ragréage : 25 × 3 × 1,5 × 1,05 = 118,13 kg → 5 sacs', proche(L('ragreage').quantiteAvecPerte, 118.13, 0.01) && L('ragreage').achat?.nombre === 5);
verifier('primaire ajouté automatiquement avec le ragréage', !!r.lignes.find((x) => x.code === 'primaire'));
// plinthes : (20 − 0,8) / 0,6 × 1,1 = 35,2 → 36 achetées (pas de conditionnement : quantité arrondie à l'affichage)
verifier('plinthes : 35,2 → 36 pièces à acheter', proche(L('plinthes').quantiteAvecPerte, 35.2) && L('plinthes').achat?.nombre === 36);
verifier('croisillons : ~69 carreaux → 1 sachet', L('croisillons').achat?.nombre === 1);
verifier('avertissement grand format présent', r.avertissements.some((a) => a.includes('double encollage')));

// Sans carton connu : pas de nombre de cartons, mais un avertissement
const r2 = calculer('carrelage-sol', parametresParDefaut(o, { surface: 10 }));
verifier('sans m²/carton : pas d’achat calculé pour les carreaux', r2.lignes.find((x) => x.code === 'carreaux')!.achat === null);
verifier('sans m²/carton : avertissement', r2.avertissements.some((a) => a.includes('carton')));
verifier('sans ragréage ni primaire : aucune ligne de préparation', !r2.lignes.some((x) => x.code === 'ragreage' || x.code === 'primaire'));

// Pose diagonale = 15 %
const r3 = calculer('carrelage-sol', parametresParDefaut(o, { surface: 10, pose: 'diagonale' }));
verifier('diagonale : 10 m² → 11,5 m²', proche(r3.lignes.find((x) => x.code === 'carreaux')!.quantiteAvecPerte, 11.5));

// Faïence murale 12 m², 40×25 (1000 cm² → 6 kg/m²), angles 5 ml → 3 baguettes
const f = trouverOuvrage('faience-murale')!;
const rf = calculer('faience-murale', parametresParDefaut(f, { surface: 12, angles: 5 }));
verifier('faïence : colle 12 × 6 × 1,05 = 75,6 kg', proche(rf.lignes.find((x) => x.code === 'colle-c2')!.quantiteAvecPerte, 75.6));
verifier('faïence : 5 ml + 10 % → 3 baguettes de 2,5 m', rf.lignes.find((x) => x.code === 'baguettes')!.achat?.nombre === 3);

// Ragréage seul 20 m² × 3 mm = 94,5 kg → 4 sacs
const rr = calculer('ragreage-sol', { surface: 20, ragreage: 3 });
verifier('ragréage seul : 94,5 kg → 4 sacs', rr.lignes.find((x) => x.code === 'ragreage')!.achat?.nombre === 4);

// Erreurs
let erreur = '';
try {
	calculer('carrelage-sol', parametresParDefaut(o, { surface: 0 }));
} catch (e) {
	erreur = e instanceof ErreurMetre ? e.message : 'autre';
}
verifier('surface nulle refusée avec un message clair', erreur.startsWith('Surface'), erreur);
let inconnu = false;
try {
	calculer('n-existe-pas', {});
} catch (e) {
	inconnu = e instanceof ErreurMetre;
}
verifier('ouvrage inconnu refusé', inconnu);
verifier('7 ouvrages dans la bibliothèque', OUVRAGES.length === 7, String(OUVRAGES.length));

// Chiffrage : 8 sacs de colle à 18,50 €, 20 cartons à 32 €, pose 35 €/m² sur 25 m²
const ch = chiffrer(r, { valeur: 25, unite: 'm²' }, { [clePrix('colle-c2', 'sac de 25 kg')]: 18.5, [clePrix('carreaux', 'carton de 1,44 m²')]: 32 }, 35);
const C = (code: string) => ch.lignes.find((x) => x.code === code)!;
verifier('chiffrage : colle 8 × 18,50 = 148 €', C('colle-c2').total === 148 && C('colle-c2').unite === 'sac de 25 kg');
verifier('chiffrage : carreaux 20 cartons × 32 = 640 €', C('carreaux').total === 640);
verifier('chiffrage : plinthes facturées à la pièce (36 u)', C('plinthes').quantite === 36 && C('plinthes').unite === 'u');
verifier('chiffrage : main-d’œuvre 25 × 35 = 875 €', ch.totalMainOeuvre === 875);
verifier('chiffrage : total = 148 + 640 + 875 = 1 663 €', ch.total === 1663, String(ch.total));
verifier('chiffrage : lignes sans prix signalées', ch.sansPrix === r.lignes.length - 2, String(ch.sansPrix));
const brouillon = versBrouillonDevis({ resultat: r, reference: { valeur: 25, unite: 'm²' }, chiffrage: ch, chantierId: null, metier: 'Carrelage', avertissements: r.avertissements });
verifier('brouillon de devis au format de la page Devis IA', brouillon.estimate.total === 1663 && brouillon.estimate.lines.length === ch.lignes.length && brouillon.source === 'metre');
const sansMo = chiffrer(r, { valeur: 25, unite: 'm²' }, {}, 0);
// Un prix « au carton » n'est pas réutilisé quand les carreaux sont comptés au m²
const r10 = calculer('carrelage-sol', parametresParDefaut(o, { surface: 10 }));
const ch10 = chiffrer(r10, { valeur: 10, unite: 'm²' }, { [clePrix('carreaux', 'carton de 1,44 m²')]: 32 }, 0);
verifier('prix au carton non appliqué à des m²', ch10.lignes.find((l) => l.code === 'carreaux')!.prixUnitaire === 0);
verifier('sans main-d’œuvre : pas de ligne MO', !sansMo.lignes.some((l) => l.type === 'labor') && sansMo.total === 0);

// --- Peinture : 40 m², 2 couches à 9 m²/L, impression à 8 m²/L
const pe = trouverOuvrage('peinture-murs')!;
const rp = calculer('peinture-murs', parametresParDefaut(pe, { surface: 40 }));
const P = (c: string) => rp.lignes.find((x) => x.code === c)!;
verifier('peinture : impression 40 / 8 × 1,05 = 5,25 L → 1 pot de 10 L', proche(P('impression').quantiteAvecPerte, 5.25) && P('impression').achat?.nombre === 1);
verifier('peinture : finition 80 / 9 × 1,05 = 9,33 L → 1 pot', proche(P('peinture-finition').quantiteAvecPerte, 9.33, 0.01) && P('peinture-finition').achat?.nombre === 1);
const rp2 = calculer('peinture-murs', parametresParDefaut(pe, { surface: 40, pot: 2.5 }));
verifier('peinture : en pots de 2,5 L → 4 pots de finition', rp2.lignes.find((x) => x.code === 'peinture-finition')!.achat?.nombre === 4);

// --- Cloison 72/48 : 4 m × 2,50 m − 1,7 m² de porte = 8,3 m²
const cl = trouverOuvrage('cloison-72-48')!;
const pc = parametresParDefaut(cl, { longueur: 4, hauteur: 2.5, ouvertures: 1.7 });
const rc = calculer('cloison-72-48', pc);
const Cl = (c: string) => rc.lignes.find((x) => x.code === c)!;
verifier('cloison : référence 8,3 m²', proche(referenceDe(cl, pc).valeur, 8.3) && referenceDe(cl, pc).unite === 'm²');
verifier('cloison : 16,6 m² × 1,05 = 17,43 m² → 6 plaques', proche(Cl('plaques-ba13').quantiteAvecPerte, 17.43) && Cl('plaques-ba13').achat?.nombre === 6);
verifier('cloison : rails 8,4 ml → 3 rails de 3 m', Cl('rails-48').achat?.nombre === 3);
verifier('cloison : montants 4 / 0,6 → 7 + 1 = 8', Cl('montants-48').achat?.nombre === 8);
verifier('cloison : vis 200,9 → 1 boîte', proche(Cl('vis-ttpc').quantiteAvecPerte, 200.86) && Cl('vis-ttpc').achat?.nombre === 1);
verifier('cloison : bande 24,4 ml → 1 rouleau', proche(Cl('bande-joint').quantiteAvecPerte, 24.4, 0.01) && Cl('bande-joint').achat?.nombre === 1);
verifier('cloison : isolant 8,72 m²', proche(Cl('isolant-45').quantiteAvecPerte, 8.72, 0.01));
verifier('cloison incomplète : pas prête à calculer', !pretACalculer(cl, parametresParDefaut(cl, {})));
let errCl = '';
try { calculer('cloison-72-48', parametresParDefaut(cl, { longueur: 1, hauteur: 2.5, ouvertures: 5 })); } catch (e) { errCl = e instanceof ErreurMetre ? e.message : 'autre'; }
verifier('cloison : ouvertures trop grandes refusées', errCl.startsWith('Les ouvertures'), errCl);

// --- Gazon : 200 m² en création, 5 cm de terre
const gz = trouverOuvrage('semis-gazon')!;
const rg = calculer('semis-gazon', parametresParDefaut(gz, { surface: 200, terre: 5 }));
verifier('gazon : 200 × 35 g × 1,1 = 7,7 kg → 2 sacs de 5 kg', proche(rg.lignes[0].quantiteAvecPerte, 7.7) && rg.lignes[0].achat?.nombre === 2);
verifier('gazon : terre 10 m³ × 1,15 = 11,5 m³', proche(rg.lignes.find((x) => x.code === 'terre-vegetale')!.quantiteAvecPerte, 11.5));
const rg2 = calculer('semis-gazon', parametresParDefaut(gz, { surface: 200, travaux: 'regarnissage' }));
verifier('gazon : regarnissage 20 g/m² → 4,4 kg', proche(rg2.lignes[0].quantiteAvecPerte, 4.4));

// --- Haie : 30 m, plants tous les 60 cm
const hi = trouverOuvrage('plantation-haie')!;
const ph = parametresParDefaut(hi, { longueur: 30 });
const rh = calculer('plantation-haie', ph);
verifier('haie : 51 plants + 5 % → 54', rh.lignes[0].achat?.nombre === 54, String(rh.lignes[0].achat?.nombre));
verifier('haie : paillage 30 × 1 × 0,15 × 1,1 = 4,95 m³', proche(rh.lignes.find((x) => x.code === 'paillage')!.quantiteAvecPerte, 4.95));
verifier('haie : référence 30 ml', referenceDe(hi, ph).valeur === 30 && referenceDe(hi, ph).unite === 'ml');
const rh2 = calculer('plantation-haie', parametresParDefaut(hi, { longueur: 30, rangs: '2' }));
verifier('haie 2 rangs : 102 + 5 % → 108 plants, paillage 7,43 m³', rh2.lignes[0].achat?.nombre === 108 && proche(rh2.lignes[1].quantiteAvecPerte, 7.43, 0.01));
const chh = chiffrer(rh, referenceDe(hi, ph), {}, 12);
verifier('haie : main-d’œuvre au mètre linéaire (30 ml × 12 € = 360 €)', chh.totalMainOeuvre === 360 && chh.lignes.at(-1)!.unite === 'ml');

console.log(echecs === 0 ? '\nTous les tests passent.' : `\n${echecs} test(s) en échec.`);
if (echecs > 0) process.exit(1);
