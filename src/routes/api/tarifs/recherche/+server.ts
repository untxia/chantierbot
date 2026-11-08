import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Recherche dans les lignes des tarifs de l'utilisateur (désignation ou référence). */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	// Caractères de syntaxe des filtres retirés : la recherche ne peut pas modifier la requête.
	const q = (url.searchParams.get('q') ?? '').replace(/[,()%*\\:]/g, ' ').trim().slice(0, 80);
	if (q.length < 2) return json({ lignes: [] });

	const { data, error } = await locals.supabase
		.from('tarif_lignes')
		.select('id, reference, designation, unite, prix_ht, tva, tarifs(fournisseur, date_tarif, created_at)')
		.eq('user_id', locals.user.id)
		.or(`designation.ilike.%${q}%,reference.ilike.%${q}%`)
		.order('designation')
		.limit(25);
	if (error) return json({ error: 'Recherche impossible.' }, { status: 500 });
	return json({ lignes: data ?? [] });
};
