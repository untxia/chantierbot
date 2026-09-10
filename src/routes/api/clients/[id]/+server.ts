import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const update: Record<string, string | null> = {};
	if (typeof body?.name === 'string') update.name = body.name.trim();
	if (typeof body?.email === 'string') update.email = body.email.trim() || null;
	if (typeof body?.phone === 'string') update.phone = body.phone.trim() || null;
	if (typeof body?.address === 'string') update.address = body.address.trim() || null;
	if (update.name === '') return json({ error: 'Le nom du client est requis.' }, { status: 400 });
	const { data, error } = await locals.supabase.from('clients').update(update).eq('id', params.id).select('id, name, email, phone, address, created_at').single();
	if (error) return json({ error: 'Impossible de modifier le client.' }, { status: 500 });
	return json({ client: data });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const { error } = await locals.supabase.from('clients').delete().eq('id', params.id);
	if (error) return json({ error: 'Impossible de supprimer le client.' }, { status: 500 });
	return json({ ok: true });
};
