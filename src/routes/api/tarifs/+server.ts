import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAX_LIGNES } from '$lib/tarifs/import';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PAQUET = 1000;

/** Liste des tarifs importés par l'utilisateur, avec le nombre de lignes. */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const { data, error } = await locals.supabase
		.from('tarifs')
		.select('id, fournisseur, date_tarif, fichier, created_at, tarif_lignes(count)')
		.eq('user_id', locals.user.id)
		.order('created_at', { ascending: false });
	if (error) return json({ error: 'Impossible de charger les tarifs.' }, { status: 500 });
	return json({
		tarifs: (data ?? []).map((t) => ({ ...t, lignes: (t.tarif_lignes as unknown as { count: number }[])?.[0]?.count ?? 0, tarif_lignes: undefined }))
	});
};

/** Enregistre un tarif et ses lignes (déjà lues et vérifiées côté navigateur, revérifiées ici). */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const uid = locals.user.id;
	const body = await request.json().catch(() => null);

	const fournisseur = typeof body?.fournisseur === 'string' ? body.fournisseur.trim().slice(0, 120) : '';
	const dateTarif = typeof body?.date_tarif === 'string' && DATE_RE.test(body.date_tarif) ? body.date_tarif : null;
	const fichier = typeof body?.fichier === 'string' ? body.fichier.slice(0, 200) : null;
	if (!fournisseur) return json({ error: 'Le nom du fournisseur est obligatoire.' }, { status: 400 });
	if (!Array.isArray(body?.lignes) || body.lignes.length === 0) return json({ error: 'Aucune ligne à importer.' }, { status: 400 });
	if (body.lignes.length > MAX_LIGNES) return json({ error: `Maximum ${MAX_LIGNES} lignes par tarif.` }, { status: 400 });

	const lignes = [];
	for (const l of body.lignes) {
		const designation = typeof l?.designation === 'string' ? l.designation.trim().slice(0, 300) : '';
		const prix = Number(l?.prix_ht);
		const tva = Number(l?.tva);
		if (!designation || !Number.isFinite(prix) || prix < 0 || !Number.isFinite(tva) || tva < 0 || tva > 100) {
			return json({ error: 'Une ligne du tarif est invalide.' }, { status: 400 });
		}
		lignes.push({
			user_id: uid,
			designation,
			reference: typeof l.reference === 'string' && l.reference.trim() ? l.reference.trim().slice(0, 80) : null,
			unite: typeof l.unite === 'string' && l.unite.trim() ? l.unite.trim().slice(0, 40) : null,
			prix_ht: Math.round(prix * 10000) / 10000,
			tva
		});
	}

	const { data: tarif, error } = await locals.supabase
		.from('tarifs')
		.insert({ user_id: uid, fournisseur, date_tarif: dateTarif, fichier })
		.select('id')
		.single();
	if (error || !tarif) {
		console.error('Création tarif :', error);
		return json({ error: 'Impossible d’enregistrer le tarif.' }, { status: 500 });
	}

	for (let i = 0; i < lignes.length; i += PAQUET) {
		const { error: e } = await locals.supabase.from('tarif_lignes').insert(lignes.slice(i, i + PAQUET).map((l) => ({ ...l, tarif_id: tarif.id })));
		if (e) {
			console.error('Lignes de tarif :', e);
			// Pas de transaction côté client : on retire le tarif incomplet (les lignes partent en cascade).
			await locals.supabase.from('tarifs').delete().eq('id', tarif.id).eq('user_id', uid);
			return json({ error: 'Import interrompu, rien n’a été enregistré.' }, { status: 500 });
		}
	}
	return json({ tarif: { id: tarif.id, lignes: lignes.length } }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	if (typeof body?.id !== 'string' || !UUID_RE.test(body.id)) return json({ error: 'Identifiant invalide.' }, { status: 400 });
	const { error } = await locals.supabase.from('tarifs').delete().eq('id', body.id).eq('user_id', locals.user.id);
	if (error) return json({ error: 'Suppression impossible.' }, { status: 500 });
	return json({ ok: true });
};
