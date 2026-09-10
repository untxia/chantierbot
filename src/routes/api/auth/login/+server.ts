import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { setAuthCookies } from '$lib/services/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!email || !password) return json({ error: 'Email et mot de passe requis.' }, { status: 400 });

	const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});
	const { data, error } = await client.auth.signInWithPassword({ email, password });

	if (error || !data.session) return json({ error: error?.message ?? 'Connexion impossible.' }, { status: 401 });

	setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);
	return json({ user: data.user, session: data.session });
};
