import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json().catch(() => null);
	const name = body?.name;
	if (!name || typeof name !== 'string' || !name.trim()) return json({ error: 'Nom du chantier manquant' }, { status: 400 });
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });

	const { data, error } = await locals.supabase
		.from('chantiers')
		.insert({ name: name.trim(), user_id: locals.user.id })
		.select()
		.single();
	if (error) {
		console.error('Erreur création chantier:', error);
		return json({ error: 'Échec de la création du chantier' }, { status: 500 });
	}
	return json({ chantier: data }, { status: 201 });
};
