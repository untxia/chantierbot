import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';

const ACCESS_COOKIE = 'chantierbot-access-token';
const REFRESH_COOKIE = 'chantierbot-refresh-token';

export const browserSupabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

function cookieOptions() {
	return {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		maxAge: 60 * 60 * 24 * 30
	};
}

export function setAuthCookies(cookies: Cookies, accessToken: string, refreshToken: string) {
	const options = cookieOptions();
	cookies.set(ACCESS_COOKIE, accessToken, options);
	cookies.set(REFRESH_COOKIE, refreshToken, options);
}

export function clearAuthCookies(cookies: Cookies) {
	cookies.delete(ACCESS_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
}

export async function getServerAuth(cookies: Cookies) {
	const accessToken = cookies.get(ACCESS_COOKIE);
	const refreshToken = cookies.get(REFRESH_COOKIE);
	const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});
	if (!accessToken || !refreshToken) return { client, user: null, session: null };

	const { data, error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
	if (error || !data.user || !data.session) {
		clearAuthCookies(cookies);
		return { client, user: null, session: null };
	}
	if (data.session.access_token !== accessToken || data.session.refresh_token !== refreshToken) {
		setAuthCookies(cookies, data.session.access_token, data.session.refresh_token);
	}
	return { client, user: data.user, session: data.session };
}

export async function requireUser(cookies: Cookies) {
	const auth = await getServerAuth(cookies);
	if (!auth.user) throw new Error('UNAUTHENTICATED');
	return auth;
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
