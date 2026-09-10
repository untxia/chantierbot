import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TYPES = ['client', 'intervention', 'livraison', 'reunion', 'autre'];

function validDate(value: unknown) {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	if (!body?.title?.trim() || !validDate(body.start_at) || !validDate(body.end_at)) {
		return json({ error: 'Titre, début et fin sont obligatoires' }, { status: 400 });
	}
	if (Date.parse(body.end_at) <= Date.parse(body.start_at)) return json({ error: 'La fin doit être après le début' }, { status: 400 });
	const type = TYPES.includes(body.type) ? body.type : 'autre';
	const { data, error } = await locals.supabase.from('rendez_vous').insert({
		user_id: locals.user.id, title: body.title.trim(), description: body.description?.trim() || null,
		type, start_at: body.start_at, end_at: body.end_at,
		chantier_id: body.chantier_id || null, client_id: body.client_id || null
	}).select().single();
	if (error) return json({ error: 'Échec de la création du rendez-vous' }, { status: 500 });
	return json({ rendez_vous: data }, { status: 201 });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	if (!body?.id) return json({ error: 'Identifiant manquant' }, { status: 400 });
	const update: Record<string, unknown> = {};
	for (const key of ['title', 'description', 'start_at', 'end_at', 'chantier_id', 'client_id']) if (body[key] !== undefined) update[key] = body[key];
	if (body.type !== undefined) update.type = TYPES.includes(body.type) ? body.type : 'autre';
	if (update.title !== undefined && (!update.title || typeof update.title !== 'string' || !update.title.trim())) return json({ error: 'Titre invalide' }, { status: 400 });
	if (update.start_at && !validDate(update.start_at) || update.end_at && !validDate(update.end_at)) return json({ error: 'Date invalide' }, { status: 400 });
	if (update.start_at && update.end_at && Date.parse(String(update.end_at)) <= Date.parse(String(update.start_at))) return json({ error: 'La fin doit être après le début' }, { status: 400 });
	if (typeof update.title === 'string') update.title = update.title.trim();
	if (typeof update.description === 'string') update.description = update.description.trim() || null;
	const { data, error } = await locals.supabase.from('rendez_vous').update(update).eq('id', body.id).eq('user_id', locals.user.id).select().single();
	if (error) return json({ error: 'Rendez-vous introuvable ou mise à jour impossible' }, { status: 404 });
	return json({ rendez_vous: data });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	if (!body?.id) return json({ error: 'Identifiant manquant' }, { status: 400 });
	const { error } = await locals.supabase.from('rendez_vous').delete().eq('id', body.id).eq('user_id', locals.user.id);
	if (error) return json({ error: 'Suppression impossible' }, { status: 500 });
	return new Response(null, { status: 204 });
};
