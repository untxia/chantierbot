import type { LayoutServerLoad } from './$types';

/** Rôle de l'utilisateur, pour n'afficher l'entrée « Administration » qu'aux administrateurs. */
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) return { isAdmin: false };
	const { data } = await locals.supabase.from('profiles').select('role').eq('id', locals.user.id).maybeSingle();
	return { isAdmin: data?.role === 'admin' };
};
