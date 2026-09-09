import { supabase } from '$lib/services/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [{ count: chantierCount }, { count: photoCount }, { data: recent, error: recentError }] = await Promise.all([
		supabase.from('chantiers').select('*', { count: 'exact', head: true }),
		supabase.from('chantier_photos').select('*', { count: 'exact', head: true }),
		supabase
			.from('chantiers')
			.select('id, name, status, created_at, chantier_photos(count)')
			.order('created_at', { ascending: false })
			.limit(6)
	]);

	if (recentError) throw recentError;

	const { data: lastPhoto } = await supabase
		.from('chantier_photos')
		.select('created_at')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	return {
		kpis: {
			chantierCount: chantierCount ?? 0,
			photoCount: photoCount ?? 0,
			lastActivity: lastPhoto?.created_at ?? null
		},
		recentChantiers: (recent ?? []).map((c) => ({
			id: c.id as string,
			name: c.name as string,
			status: c.status as 'en_cours' | 'termine' | 'en_attente',
			createdAt: c.created_at as string,
			photoCount: (c.chantier_photos as { count: number }[])[0]?.count ?? 0
		}))
	};
};
