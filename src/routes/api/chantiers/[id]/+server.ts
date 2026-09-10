import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_STATUSES = ['en_cours', 'termine', 'en_attente'];

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const body = await request.json().catch(() => null);
	const update: Record<string, unknown> = {};
	if (body?.status !== undefined) {
		if (!VALID_STATUSES.includes(body.status)) return json({ error: 'Statut invalide' }, { status: 400 });
		update.status = body.status;
	}
	if (body?.progress !== undefined) {
		const progress = Number(body.progress);
		if (Number.isNaN(progress) || progress < 0 || progress > 100) return json({ error: 'Avancement invalide (0-100)' }, { status: 400 });
		update.progress = progress;
	}
	if (Object.keys(update).length === 0) return json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });

	const { data, error } = await locals.supabase.from('chantiers').update(update).eq('id', params.id).select().single();
	if (error) {
		console.error('Erreur mise à jour chantier:', error);
		return json({ error: 'Échec de la mise à jour' }, { status: 500 });
	}
	return json({ chantier: data });
};
