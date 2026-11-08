import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { interpreter } from '$lib/assistant/intentions';
import { ErreurMetre, minusculeInitiale, parametresParDefaut, pretACalculer, referenceDe, trouverOuvrage } from '$lib/metre';

interface Reponse {
	intention: string;
	reponse: string;
	details: string[];
	liens: { label: string; href: string }[];
}

const nf = (x: number, d = 2) => x.toLocaleString('fr-FR', { maximumFractionDigits: d });
const jourParis = (d: Date) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const heureParis = (d: Date) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(d);
const dateFr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

const AIDE: Reponse = {
	intention: 'aide',
	reponse: 'Je peux vous aider sur vos chantiers. Essayez par exemple :',
	details: [
		'« Carrelage 25 m² en 60x60 » → fournitures à acheter',
		'« Ragréage 20 m² sur 3 mm », « Peinture 40 m² en 2 couches »',
		'« Cloison placo 4 m x 2,5 m », « Gazon 200 m² », « Haie de 30 m »',
		'« Quelles relances sont en retard ? »',
		'« Mes rendez-vous de demain »',
		'« Où en est le chantier Dupont ? »',
		'« Où en sont mes commandes ? »'
	],
	liens: []
};

/**
 * Assistant sans IA externe : interprète la demande (règles) puis répond avec les données
 * de l'utilisateur. Toutes les requêtes sont filtrées sur user_id (un admin verrait sinon tout).
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const texte = typeof body?.texte === 'string' ? body.texte.slice(0, 500) : '';
	const db = locals.supabase;
	const uid = locals.user.id;
	const intention = interpreter(texte);

	switch (intention.type) {
		case 'metre': {
			const ouvrage = trouverOuvrage(intention.ouvrage)!;
			const query = new URLSearchParams({ ouvrage: ouvrage.code });
			for (const [k, v] of Object.entries(intention.params)) query.set(k, String(v));
			const lien = { label: 'Ouvrir le métré détaillé', href: `/metre?${query}` };
			const params = parametresParDefaut(ouvrage, intention.params);
			if (!pretACalculer(ouvrage, params)) {
				const manquants = ouvrage.champs
					.filter((c) => c.type === 'number' && c.requis && !(Number(params[c.id]) > 0))
					.map((c) => `${c.label.toLowerCase()}${c.type === 'number' && c.unite ? ` (${c.unite})` : ''}`);
				return json({
					intention: 'metre',
					reponse: `${ouvrage.designation} : précisez ${manquants.join(' et ')}, par exemple « ${ouvrage.reference ? 'cloison 4 m x 2,5 m' : '25 m²'} ».`,
					details: [],
					liens: [lien]
				} satisfies Reponse);
			}
			try {
				const r = ouvrage.calculer(params);
				const ref = referenceDe(ouvrage, params);
				const details = r.lignes.map((l) =>
					l.achat
						? `${l.designation} : ${l.achat.nombre} ${l.achat.conditionnement === 'à l’unité' ? (l.achat.nombre > 1 ? 'pièces' : 'pièce') : `× ${l.achat.conditionnement}`}`
						: `${l.designation} : ${nf(l.quantiteAvecPerte)} ${l.unite} (chutes comprises)`
				);
				return json({
					intention: 'metre',
					reponse: `Pour ${nf(ref.valeur)} ${ref.unite} — ${minusculeInitiale(ouvrage.designation)} :`,
					details: [...details, ...r.avertissements.map((a) => `⚠ ${a}`)],
					liens: [lien]
				} satisfies Reponse);
			} catch (e) {
				return json({ intention: 'metre', reponse: e instanceof ErreurMetre ? e.message : 'Calcul impossible.', details: [], liens: [lien] } satisfies Reponse);
			}
		}

		case 'relances': {
			const { data, error } = await db
				.from('relances')
				.select('id, title, due_date, priority')
				.eq('user_id', uid)
				.eq('status', 'a_faire')
				.order('due_date', { ascending: true, nullsFirst: false })
				.limit(50);
			if (error) return json({ error: 'Impossible de lire les relances.' }, { status: 500 });
			const today = jourParis(new Date());
			const toutes = data ?? [];
			const enRetard = toutes.filter((r) => r.due_date && (r.due_date as string) < today);
			const liste = intention.retardSeulement ? enRetard : toutes;
			const reponse = intention.retardSeulement
				? enRetard.length === 0
					? 'Aucune relance en retard. 👍'
					: `${pluriel(enRetard.length, 'relance')} en retard :`
				: toutes.length === 0
					? 'Aucune relance à faire.'
					: `${pluriel(toutes.length, 'relance')} à faire, dont ${enRetard.length} en retard :`;
			return json({
				intention: 'relances',
				reponse,
				details: liste.slice(0, 6).map((r) => `${r.title}${r.due_date ? ` — échéance ${dateFr(r.due_date as string)}` : ''}${r.priority === 'urgente' || r.priority === 'haute' ? ` (${r.priority})` : ''}`),
				liens: [{ label: 'Voir les relances', href: '/relances' }]
			} satisfies Reponse);
		}

		case 'planning': {
			const maintenant = new Date();
			const { data, error } = await db
				.from('rendez_vous')
				.select('id, title, start_at, type')
				.eq('user_id', uid)
				.gte('start_at', new Date(maintenant.getTime() - 24 * 3600e3).toISOString())
				.lte('start_at', new Date(maintenant.getTime() + 9 * 24 * 3600e3).toISOString())
				.order('start_at');
			if (error) return json({ error: 'Impossible de lire le planning.' }, { status: 500 });
			const aujourdhui = jourParis(maintenant);
			const demain = jourParis(new Date(maintenant.getTime() + 24 * 3600e3));
			const dansSemaine = jourParis(new Date(maintenant.getTime() + 7 * 24 * 3600e3));
			const rdv = (data ?? []).filter((r) => {
				const j = jourParis(new Date(r.start_at as string));
				if (intention.periode === 'aujourdhui') return j === aujourdhui;
				if (intention.periode === 'demain') return j === demain;
				return j >= aujourdhui && j <= dansSemaine;
			});
			const quand = intention.periode === 'aujourdhui' ? 'aujourd’hui' : intention.periode === 'demain' ? 'demain' : 'ces 7 prochains jours';
			return json({
				intention: 'planning',
				reponse: rdv.length === 0 ? `Rien de prévu ${quand}.` : `${pluriel(rdv.length, 'rendez-vous')} ${quand} :`,
				details: rdv.slice(0, 8).map((r) => {
					const d = new Date(r.start_at as string);
					const jour = intention.periode === 'semaine' ? `${d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric' })} ` : '';
					return `${jour}${heureParis(d)} — ${r.title}`;
				}),
				liens: [{ label: 'Ouvrir le planning', href: '/planning' }]
			} satisfies Reponse);
		}

		case 'commandes': {
			const { data, error } = await db
				.from('commandes')
				.select('id, status, expected_date, total_ht, fournisseurs(name)')
				.eq('user_id', uid)
				.in('status', ['brouillon', 'commandee'])
				.order('expected_date', { ascending: true, nullsFirst: false })
				.limit(20);
			if (error) return json({ error: 'Impossible de lire les commandes.' }, { status: 500 });
			const liste = data ?? [];
			const brouillons = liste.filter((c) => c.status === 'brouillon').length;
			return json({
				intention: 'commandes',
				reponse:
					liste.length === 0
						? 'Aucune commande en cours.'
						: `${pluriel(liste.length, 'commande')} en cours (${brouillons} en brouillon, ${liste.length - brouillons} passée${liste.length - brouillons > 1 ? 's' : ''}) :`,
				details: liste.slice(0, 6).map((c) => {
					const fournisseur = (c.fournisseurs as unknown as { name: string } | null)?.name ?? 'Fournisseur';
					const statut = c.status === 'brouillon' ? 'brouillon' : 'commandée';
					return `${fournisseur} — ${statut}${c.expected_date ? `, attendue le ${dateFr(c.expected_date as string)}` : ''} — ${nf(Number(c.total_ht ?? 0))} € HT`;
				}),
				liens: [{ label: 'Voir les commandes', href: '/commandes' }]
			} satisfies Reponse);
		}

		case 'chantier': {
			const motif = intention.recherche.replace(/[%_\\]/g, '').slice(0, 60);
			const { data, error } = await db
				.from('chantiers')
				.select('id, name, status, progress, end_date')
				.eq('user_id', uid)
				.ilike('name', `%${motif}%`)
				.limit(5);
			if (error) return json({ error: 'Impossible de lire les chantiers.' }, { status: 500 });
			const liste = data ?? [];
			const statut = (s: string) => (s === 'termine' ? 'terminé' : s === 'en_attente' ? 'en attente' : 'en cours');
			return json({
				intention: 'chantier',
				reponse: liste.length === 0 ? `Aucun chantier ne correspond à « ${motif} ».` : liste.length === 1 ? 'Voici ce chantier :' : `${liste.length} chantiers correspondent :`,
				details: liste.map((c) => `${c.name} — ${statut(c.status as string)}, ${c.progress ?? 0} %${c.end_date ? `, fin prévue le ${dateFr(c.end_date as string)}` : ''}`),
				liens: liste.length > 0 ? liste.map((c) => ({ label: `Ouvrir « ${c.name} »`, href: `/chantiers/${c.id}` })) : [{ label: 'Tous les chantiers', href: '/projets' }]
			} satisfies Reponse);
		}

		case 'chantiers': {
			const { data, error } = await db
				.from('chantiers')
				.select('id, name, progress')
				.eq('user_id', uid)
				.eq('status', 'en_cours')
				.order('created_at', { ascending: false })
				.limit(8);
			if (error) return json({ error: 'Impossible de lire les chantiers.' }, { status: 500 });
			const liste = data ?? [];
			return json({
				intention: 'chantiers',
				reponse: liste.length === 0 ? 'Aucun chantier en cours.' : `${pluriel(liste.length, 'chantier')} en cours :`,
				details: liste.map((c) => `${c.name} — ${c.progress ?? 0} %`),
				liens: [{ label: 'Tous les chantiers', href: '/projets' }]
			} satisfies Reponse);
		}

		case 'stock':
			return json({
				intention: 'stock',
				reponse: 'Le suivi des stocks et la prédiction des ruptures sont dans la page Stocks.',
				details: [],
				liens: [{ label: 'Ouvrir les stocks', href: '/analyses' }]
			} satisfies Reponse);

		case 'mesure':
			return json({
				intention: 'mesure',
				reponse: 'Mesurez une longueur ou une surface avec l’appareil photo (réalité augmentée ou photo), puis calculez les fournitures.',
				details: [],
				liens: [
					{ label: 'Mesurer', href: '/mesures' },
					{ label: 'Métré', href: '/metre' }
				]
			} satisfies Reponse);

		default:
			return json(AIDE);
	}
};
