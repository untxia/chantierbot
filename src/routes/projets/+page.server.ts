import { supabase } from '$lib/services/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';

	let query = supabase
		.from('chantiers')
		.select('id, name, status, progress, created_at, chantier_photos(count)')
		.order('created_at', { ascending: false });

	if (q) query = query.ilike('name', `%${q}%`);

	const { data: chantiers, error } = await query;

	if (error) throw error;

	return {
		q,
		chantiers: (chantiers ?? []).map((c) => ({
			id: c.id as string,
			name: c.name as string,
			status: c.status as 'en_cours' | 'termine' | 'en_attente',
			progress: c.progress as number,
			createdAt: c.created_at as string,
			photoCount: (c.chantier_photos as { count: number }[])[0]?.count ?? 0
		}))
	};
};
