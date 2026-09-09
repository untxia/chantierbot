import { supabase } from '$lib/services/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { data: chantiers, error } = await supabase
		.from('chantiers')
		.select('id, name, status, created_at, chantier_photos(count)')
		.order('created_at', { ascending: false });

	if (error) throw error;

	return {
		chantiers: (chantiers ?? []).map((c) => ({
			id: c.id as string,
			name: c.name as string,
			status: c.status as 'en_cours' | 'termine' | 'en_attente',
			createdAt: c.created_at as string,
			photoCount: (c.chantier_photos as { count: number }[])[0]?.count ?? 0
		}))
	};
};
