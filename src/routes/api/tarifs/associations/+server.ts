import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Clé d'une fourniture du métré : « code|unité d'achat » (voir clePrix). */
const CLE_RE = /^[a-z0-9-]{1,60}\|.{1,60}$/;

/** Relie une fourniture du métré à une ligne de tarif : son prix sera repris automatiquement. */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const code = typeof body?.code_fourniture === 'string' ? body.code_fourniture : '';
	const ligneId = typeof body?.tarif_ligne_id === 'string' ? body.tarif_ligne_id : '';
	if (!CLE_RE.test(code) || !UUID_RE.test(ligneId)) return json({ error: 'Paramètres invalides.' }, { status: 400 });

	// La ligne doit appartenir à l'utilisateur (la RLS le garantit aussi).
	const { data: ligne } = await locals.supabase.from('tarif_lignes').select('id').eq('id', ligneId).eq('user_id', locals.user.id).maybeSingle();
	if (!ligne) return json({ error: 'Ligne de tarif introuvable.' }, { status: 404 });

	const { error } = await locals.supabase
		.from('tarif_associations')
		.upsert({ user_id: locals.user.id, code_fourniture: code, tarif_ligne_id: ligneId }, { onConflict: 'user_id,code_fourniture' });
	if (error) return json({ error: 'Association impossible.' }, { status: 500 });
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const code = typeof body?.code_fourniture === 'string' ? body.code_fourniture : '';
	if (!CLE_RE.test(code)) return json({ error: 'Paramètres invalides.' }, { status: 400 });
	const { error } = await locals.supabase.from('tarif_associations').delete().eq('user_id', locals.user.id).eq('code_fourniture', code);
	if (error) return json({ error: 'Suppression impossible.' }, { status: 500 });
	return json({ ok: true });
};
