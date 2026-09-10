import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAuthCookies, getServerAuth } from '$lib/services/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	const { client } = await getServerAuth(cookies);
	await client.auth.signOut().catch(() => undefined);
	clearAuthCookies(cookies);
	return json({ ok: true });
};
