import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);

	const kind = body?.kind;
	const method = body?.method;
	const value = Number(body?.value);
	const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 120) : '';
	const chantierId = body?.chantier_id || null;

	if (kind !== 'longueur' && kind !== 'surface') return json({ error: 'Type de mesure invalide' }, { status: 400 });
	if (method !== 'ar' && method !== 'photo') return json({ error: 'Méthode de mesure invalide' }, { status: 400 });
	if (!Number.isFinite(value) || value <= 0 || value >= 1_000_000) return json({ error: 'Valeur de mesure invalide' }, { status: 400 });
	if (chantierId !== null && (typeof chantierId !== 'string' || !UUID_RE.test(chantierId))) {
		return json({ error: 'Chantier invalide' }, { status: 400 });
	}

	const { data, error } = await locals.supabase
		.from('mesures')
		.insert({ user_id: locals.user.id, chantier_id: chantierId, label: label || null, kind, value, method })
		.select('id, label, kind, value, method, created_at, chantier_id')
		.single();
	if (error) {
		console.error('Erreur enregistrement mesure:', error);
		return json({ error: "Impossible d'enregistrer la mesure." }, { status: 500 });
	}
	return json({ mesure: data }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	if (typeof body?.id !== 'string' || !UUID_RE.test(body.id)) return json({ error: 'Identifiant invalide' }, { status: 400 });

	const { error } = await locals.supabase.from('mesures').delete().eq('id', body.id).eq('user_id', locals.user.id);
	if (error) {
		console.error('Erreur suppression mesure:', error);
		return json({ error: 'Suppression impossible.' }, { status: 500 });
	}
	return json({ ok: true });
};
