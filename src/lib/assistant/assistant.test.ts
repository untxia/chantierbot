/** Tests de compréhension de l'assistant (npm run test:assistant). */
import { interpreter, extraireSurface, extraireFormat, extraireMm, type Intention } from './intentions';

let echecs = 0;
function verifier(nom: string, ok: boolean, detail = '') {
	if (!ok) echecs++;
	console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ` — ${detail}` : ''}`);
}
const vu = (i: Intention) => JSON.stringify(i);

verifier('surface « 25 m² »', extraireSurface('carrelage 25 m2') === 25);
verifier('surface « 12,5 m 2 »', extraireSurface('faience 12,5 m 2') === 12.5);
verifier('surface « 30 metres carres »', extraireSurface('30 metres carres') === 30);
verifier('pas de surface dans « 3 mm »', extraireSurface('ragreage 3 mm') === null);
verifier('format « 60x60 »', JSON.stringify(extraireFormat('60x60')) === '{"longueur":60,"largeur":60}');
verifier('format « 30 x 60 cm »', JSON.stringify(extraireFormat('30 x 60 cm')) === '{"longueur":30,"largeur":60}');
verifier('épaisseur « 3 mm »', extraireMm('ragreage 3 mm') === 3);

const cas: [string, (i: Intention) => boolean][] = [
	['Carrelage 25 m² en 60x60', (i) => i.type === 'metre' && i.ouvrage === 'carrelage-sol' && i.params.surface === 25 && i.params.longueur === 60],
	['Combien de sacs de colle pour 40 m2 de carrelage ?', (i) => i.type === 'metre' && i.params.surface === 40],
	['Faïence 12 m² 25x40 pour la salle de bain', (i) => i.type === 'metre' && i.ouvrage === 'faience-murale' && i.params.surface === 12 && i.params.largeur === 40],
	['Ragréage 20 m² sur 3 mm', (i) => i.type === 'metre' && i.ouvrage === 'ragreage-sol' && i.params.ragreage === 3 && i.params.surface === 20],
	['Carrelage 30 m² avec ragréage 5 mm', (i) => i.type === 'metre' && i.ouvrage === 'carrelage-sol' && i.params.ragreage === 5],
	['carrelage en diagonale 18 m2', (i) => i.type === 'metre' && i.params.pose === 'diagonale'],
	['Quelles relances sont en retard ?', (i) => i.type === 'relances' && i.retardSeulement],
	['Qui dois-je relancer ?', (i) => i.type === 'relances' && !i.retardSeulement],
	['Mes rendez-vous de demain', (i) => i.type === 'planning' && i.periode === 'demain'],
	['planning de la semaine', (i) => i.type === 'planning' && i.periode === 'semaine'],
	['Qu’est-ce que j’ai aujourd’hui au planning', (i) => i.type === 'planning' && i.periode === 'aujourdhui'],
	['Où en sont mes commandes ?', (i) => i.type === 'commandes'],
	['Est-ce que j’ai des ruptures de stock', (i) => i.type === 'stock'],
	['Où en est le chantier Dupont ?', (i) => i.type === 'chantier' && i.recherche === 'dupont'],
	['chantier de la rue des Lilas', (i) => i.type === 'chantier' && i.recherche === 'rue des lilas'],
	['Mes chantiers en cours', (i) => i.type === 'chantiers'],
	['Je veux mesurer une pièce', (i) => i.type === 'mesure'],
	['Peinture 40 m² en 2 couches', (i) => i.type === 'metre' && i.ouvrage === 'peinture-murs' && i.params.surface === 40 && i.params.couches === 2],
	['Repeindre le salon, 35 m2', (i) => i.type === 'metre' && i.ouvrage === 'peinture-murs' && i.params.surface === 35],
	['Cloison placo 4 m x 2,5 m', (i) => i.type === 'metre' && i.ouvrage === 'cloison-72-48' && i.params.longueur === 4 && i.params.hauteur === 2.5],
	['cloison de 6 m', (i) => i.type === 'metre' && i.ouvrage === 'cloison-72-48' && i.params.longueur === 6],
	['Gazon 200 m²', (i) => i.type === 'metre' && i.ouvrage === 'semis-gazon' && i.params.surface === 200],
	['regarnir la pelouse 80 m2', (i) => i.type === 'metre' && i.ouvrage === 'semis-gazon' && i.params.travaux === 'regarnissage'],
	['Haie de 30 m sur deux rangs', (i) => i.type === 'metre' && i.ouvrage === 'plantation-haie' && i.params.longueur === 30 && i.params.rangs === '2'],
	['Bonjour', (i) => i.type === 'aide'],
	['', (i) => i.type === 'aide']
];
for (const [texte, attendu] of cas) {
	const i = interpreter(texte);
	verifier(`« ${texte} »`, attendu(i), vu(i));
}

console.log(echecs === 0 ? '\nTous les tests passent.' : `\n${echecs} test(s) en échec.`);
if (echecs > 0) process.exit(1);
