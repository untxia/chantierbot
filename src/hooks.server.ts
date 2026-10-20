import { redirect, type Handle } from '@sveltejs/kit';
import { getServerAuth } from '$lib/services/auth';

const PUBLIC_PATHS = ['/connexion', '/confidentialite', '/mentions-legales', '/conditions'];

export const handle: Handle = async ({ event, resolve }) => {
	const publicPath = PUBLIC_PATHS.some((path) => event.url.pathname === path || event.url.pathname.startsWith(`${path}/`));
	const auth = await getServerAuth(event.cookies);
	event.locals.user = auth.user;
	event.locals.supabase = auth.client;

	if (!publicPath && !auth.user && !event.url.pathname.startsWith('/api/auth/')) {
		throw redirect(303, `/connexion?redirect=${encodeURIComponent(event.url.pathname)}`);
	}

	return resolve(event);
};
