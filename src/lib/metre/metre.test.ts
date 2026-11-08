/**
 * Tests du moteur de métré (sans framework) :
 *   npx esbuild src/lib/metre/metre.test.ts --bundle --platform=node --outfile=<tmp>/metre.test.cjs && node <tmp>/metre.test.cjs
 * Les valeurs attendues sont calculées à la main à partir des règles des fiches techniques.
 */
import { calculer, chiffrer, clePrix, versBrouillonDevis, ErreurMetre, parametresParDefaut, trouverOuvrage, OUVRAGES } from './index';
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
verifier('3 ouvrages dans la bibliothèque', OUVRAGES.length === 3);

// Chiffrage : 8 sacs de colle à 18,50 €, 20 cartons à 32 €, pose 35 €/m² sur 25 m²
const ch = chiffrer(r, 25, { [clePrix('colle-c2', 'sac de 25 kg')]: 18.5, [clePrix('carreaux', 'carton de 1,44 m²')]: 32 }, 35);
const C = (code: string) => ch.lignes.find((x) => x.code === code)!;
verifier('chiffrage : colle 8 × 18,50 = 148 €', C('colle-c2').total === 148 && C('colle-c2').unite === 'sac de 25 kg');
verifier('chiffrage : carreaux 20 cartons × 32 = 640 €', C('carreaux').total === 640);
verifier('chiffrage : plinthes facturées à la pièce (36 u)', C('plinthes').quantite === 36 && C('plinthes').unite === 'u');
verifier('chiffrage : main-d’œuvre 25 × 35 = 875 €', ch.totalMainOeuvre === 875);
verifier('chiffrage : total = 148 + 640 + 875 = 1 663 €', ch.total === 1663, String(ch.total));
verifier('chiffrage : lignes sans prix signalées', ch.sansPrix === r.lignes.length - 2, String(ch.sansPrix));
const brouillon = versBrouillonDevis({ resultat: r, surface: 25, chiffrage: ch, chantierId: null, metier: 'Carrelage', avertissements: r.avertissements });
verifier('brouillon de devis au format de la page Devis IA', brouillon.estimate.total === 1663 && brouillon.estimate.lines.length === ch.lignes.length && brouillon.source === 'metre');
const sansMo = chiffrer(r, 25, {}, 0);
// Un prix « au carton » n'est pas réutilisé quand les carreaux sont comptés au m²
const r10 = calculer('carrelage-sol', parametresParDefaut(o, { surface: 10 }));
const ch10 = chiffrer(r10, 10, { [clePrix('carreaux', 'carton de 1,44 m²')]: 32 }, 0);
verifier('prix au carton non appliqué à des m²', ch10.lignes.find((l) => l.code === 'carreaux')!.prixUnitaire === 0);
verifier('sans main-d’œuvre : pas de ligne MO', !sansMo.lignes.some((l) => l.type === 'labor') && sansMo.total === 0);

console.log(echecs === 0 ? '\nTous les tests passent.' : `\n${echecs} test(s) en échec.`);
if (echecs > 0) process.exit(1);
