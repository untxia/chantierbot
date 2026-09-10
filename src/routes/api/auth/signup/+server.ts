import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { setAuthCookies } from '$lib/services/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	const password = typeof body?.password === 'string' ? body.password : '';
	const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : '';
	const companyName = typeof body?.companyName === 'string' ? body.companyName.trim() : '';

	if (!email || !password) return json({ error: 'Email et mot de passe requis.' }, { status: 400 });
	if (password.length < 8) return json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });

	const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});
	const { data, error } = await client.auth.signUp({
		email,
		password,
		options: { data: { display_name: displayName, company_name: companyName } }
	});

	if (error) return json({ error: error.message }, { status: 400 });
	if (!data.user) return json({ error: 'Le compte n’a pas pu être créé.' }, { status: 400 });

	if (data.session) setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);
	return json({ user: data.user, session: data.session, needsEmailConfirmation: !data.session });
};
