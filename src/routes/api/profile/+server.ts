import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const { data, error } = await locals.supabase.from('profiles').select('id, display_name, company_name, trade_id, phone, avatar_url, created_at, updated_at').eq('id', locals.user.id).maybeSingle();
	if (error) return json({ error: 'Impossible de charger le profil.' }, { status: 500 });
	return json({ profile: data, email: locals.user.email ?? '' });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const update = {
		display_name: typeof body?.displayName === 'string' ? body.displayName.trim() : null,
		company_name: typeof body?.companyName === 'string' ? body.companyName.trim() : null,
		trade_id: typeof body?.tradeId === 'string' ? body.tradeId.trim() : null,
		phone: typeof body?.phone === 'string' ? body.phone.trim() : null,
		updated_at: new Date().toISOString()
	};
	const { data, error } = await locals.supabase.from('profiles').upsert({ id: locals.user.id, ...update }).select().single();
	if (error) return json({ error: 'Impossible de mettre à jour le profil.' }, { status: 500 });
	return json({ profile: data });
};
