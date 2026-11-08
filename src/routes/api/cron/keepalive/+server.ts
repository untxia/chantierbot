import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * Réveil quotidien de Supabase (tâche planifiée Vercel, voir vercel.json).
 * La formule gratuite met le projet en pause après plusieurs jours sans activité ;
 * une requête par jour suffit à l'éviter. Aucune donnée n'est lue : la requête passe
 * par la base mais l'accès anonyme y est refusé (RLS), ce qui est le comportement attendu.
 *
 * Si la variable CRON_SECRET est définie sur Vercel, seul l'appel planifié (qui envoie
 * « Authorization: Bearer <CRON_SECRET> ») est accepté.
 */
export const GET: RequestHandler = async ({ request, fetch }) => {
	const secret = env.CRON_SECRET;
	if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const debut = Date.now();
	try {
		const res = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
			headers: { apikey: PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}` }
		});
		// 200 ou 401/403 : la base a répondu. 5xx ou échec réseau : projet en pause ou indisponible.
		const joignable = res.status < 500;
		return json(
			{ ok: joignable, statutSupabase: res.status, dureeMs: Date.now() - debut, le: new Date().toISOString() },
			{ status: joignable ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
		);
	} catch (e) {
		console.error('Réveil Supabase : échec', e);
		return json({ ok: false, erreur: 'Supabase injoignable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
	}
};
