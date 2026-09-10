import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	let query = locals.supabase.from('clients').select('id, name, email, phone, address, created_at').order('name');
	if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
	const { data, error } = await query;
	if (error) return json({ error: 'Impossible de charger les clients.' }, { status: 500 });
	return json({ clients: data ?? [] });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	const name = typeof body?.name === 'string' ? body.name.trim() : '';
	if (!name) return json({ error: 'Le nom du client est requis.' }, { status: 400 });
	const payload = {
		name,
		email: typeof body?.email === 'string' ? body.email.trim() || null : null,
		phone: typeof body?.phone === 'string' ? body.phone.trim() || null : null,
		address: typeof body?.address === 'string' ? body.address.trim() || null : null,
		user_id: locals.user.id
	};
	const { data, error } = await locals.supabase.from('clients').insert(payload).select('id, name, email, phone, address, created_at').single();
	if (error) return json({ error: 'Impossible de créer le client.' }, { status: 500 });
	return json({ client: data }, { status: 201 });
};
