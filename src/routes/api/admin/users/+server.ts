import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { requireUser } from '$lib/services/auth';

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

type Role = 'admin' | 'manager' | 'user';

async function requireAdmin(cookies: Parameters<RequestHandler>[0]['cookies']) {
	const auth = await requireUser(cookies);
	const { data: me, error } = await auth.client.from('profiles').select('role').eq('id', auth.user.id).single();
	if (error || me?.role !== 'admin') throw new Error('FORBIDDEN');
	return auth.user.id;
}

function serviceClient() {
	if (!serviceKey) throw new Error('SERVICE_ROLE_NOT_CONFIGURED');
	return createClient(PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		await requireAdmin(cookies);
		const admin = serviceClient();
		const [{ data: profiles, error: profilesError }, clients, chantiers] = await Promise.all([
			admin.from('profiles').select('id, display_name, full_name, company_name, role, created_at, disabled_at').order('created_at', { ascending: false }),
			admin.from('clients').select('id', { count: 'exact', head: true }),
			admin.from('chantiers').select('id', { count: 'exact', head: true })
		]);
		if (profilesError) return json({ error: profilesError.message }, { status: 500 });
		return json({ users: profiles ?? [], stats: { users: profiles?.length ?? 0, admins: profiles?.filter((p) => p.role === 'admin').length ?? 0, managers: profiles?.filter((p) => p.role === 'manager').length ?? 0, clients: clients.count ?? 0, chantiers: chantiers.count ?? 0 } });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erreur serveur.';
		const status = message === 'FORBIDDEN' ? 403 : message === 'UNAUTHENTICATED' ? 401 : message === 'SERVICE_ROLE_NOT_CONFIGURED' ? 503 : 500;
		return json({ error: message === 'SERVICE_ROLE_NOT_CONFIGURED' ? 'La clé admin Supabase n’est pas configurée sur le serveur.' : 'Accès administrateur impossible.' }, { status });
	}
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
	try {
		const currentUserId = await requireAdmin(cookies);
		const body = await request.json().catch(() => null);
		const id = typeof body?.id === 'string' ? body.id : '';
		const role = body?.role as Role | undefined;
		const disabled = body?.disabled as boolean | undefined;
		if (!id) return json({ error: 'Utilisateur requis.' }, { status: 400 });
		if (id === currentUserId && (role !== undefined || disabled !== undefined)) return json({ error: 'Tu ne peux pas modifier ton propre compte depuis cet écran.' }, { status: 400 });
		if (role !== undefined && !['admin', 'manager', 'user'].includes(role)) return json({ error: 'Rôle invalide.' }, { status: 400 });

		const admin = serviceClient();
		if (role !== undefined) {
			const { error } = await admin.from('profiles').update({ role }).eq('id', id);
			if (error) return json({ error: error.message }, { status: 400 });
		}
		if (disabled !== undefined) {
			const { error } = await admin.from('profiles').update({ disabled_at: disabled ? new Date().toISOString() : null }).eq('id', id);
			if (error) return json({ error: error.message }, { status: 400 });
			const { error: authError } = await admin.auth.admin.updateUserById(id, { ban_duration: disabled ? '876000h' : 'none' });
			if (authError) return json({ error: authError.message }, { status: 400 });
		}
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erreur serveur.';
		const status = message === 'FORBIDDEN' ? 403 : message === 'UNAUTHENTICATED' ? 401 : message === 'SERVICE_ROLE_NOT_CONFIGURED' ? 503 : 500;
		return json({ error: message === 'SERVICE_ROLE_NOT_CONFIGURED' ? 'La clé admin Supabase n’est pas configurée sur le serveur.' : 'Modification impossible.' }, { status });
	}
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
	try {
		const currentUserId = await requireAdmin(cookies);
		const body = await request.json().catch(() => null);
		const id = typeof body?.id === 'string' ? body.id : '';
		if (!id) return json({ error: 'Utilisateur requis.' }, { status: 400 });
		if (id === currentUserId) return json({ error: 'Tu ne peux pas supprimer ton propre compte.' }, { status: 400 });

		const admin = serviceClient();
		const { error } = await admin.auth.admin.deleteUser(id);
		if (error) return json({ error: error.message }, { status: 400 });
		return json({ ok: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erreur serveur.';
		const status = message === 'FORBIDDEN' ? 403 : message === 'UNAUTHENTICATED' ? 401 : message === 'SERVICE_ROLE_NOT_CONFIGURED' ? 503 : 500;
		return json({ error: message === 'SERVICE_ROLE_NOT_CONFIGURED' ? 'La clé admin Supabase n’est pas configurée sur le serveur.' : 'Suppression impossible.' }, { status });
	}
};
