import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_STATUSES = ['en_cours', 'termine', 'en_attente'];

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const update: Record<string, unknown> = {};
	if (body?.name !== undefined) {
		if (typeof body.name !== 'string' || !body.name.trim()) return json({ error: 'Nom invalide' }, { status: 400 });
		update.name = body.name.trim();
	}
	if (body?.description !== undefined) update.description = typeof body.description === 'string' ? body.description.trim() : null;
	if (body?.address !== undefined) update.address = typeof body.address === 'string' ? body.address.trim() : null;
	if (body?.client_id !== undefined) update.client_id = body.client_id || null;
	if (body?.start_date !== undefined) update.start_date = body.start_date || null;
	if (body?.end_date !== undefined) update.end_date = body.end_date || null;
	if (body?.budget !== undefined) {
		const budget = Number(body.budget);
		if (!Number.isFinite(budget) || budget < 0) return json({ error: 'Budget invalide' }, { status: 400 });
		update.budget = budget;
	}
	if (body?.status !== undefined) {
		if (!VALID_STATUSES.includes(body.status)) return json({ error: 'Statut invalide' }, { status: 400 });
		update.status = body.status;
	}
	if (body?.progress !== undefined) {
		const progress = Number(body.progress);
		if (!Number.isFinite(progress) || progress < 0 || progress > 100) return json({ error: 'Avancement invalide (0-100)' }, { status: 400 });
		update.progress = progress;
	}
	if (Object.keys(update).length === 0) return json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
	const { data, error } = await locals.supabase.from('chantiers').update(update).eq('id', params.id).select().single();
	if (error) return json({ error: 'Échec de la mise à jour' }, { status: 500 });
	return json({ chantier: data });
};
