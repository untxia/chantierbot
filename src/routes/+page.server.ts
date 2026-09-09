import { supabase } from '$lib/services/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [
		{ count: chantierCount },
		{ count: activeCount },
		{ count: photoCount },
		{ data: recent, error: recentError },
		{ data: recommendations, error: recoError }
	] = await Promise.all([
		supabase.from('chantiers').select('*', { count: 'exact', head: true }),
		supabase.from('chantiers').select('*', { count: 'exact', head: true }).eq('status', 'en_cours'),
		supabase.from('chantier_photos').select('*', { count: 'exact', head: true }),
		supabase
			.from('chantiers')
			.select('id, name, status, progress, created_at, chantier_photos(count)')
			.order('created_at', { ascending: false })
			.limit(6),
		supabase
			.from('chantier_photos')
			.select('id, image_path, description, issues, chantiers(id, name)')
			.order('created_at', { ascending: false })
			.limit(15)
	]);

	if (recentError) throw recentError;
	if (recoError) throw recoError;

	const { data: lastPhoto } = await supabase
		.from('chantier_photos')
		.select('created_at')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	return {
		kpis: {
			chantierCount: chantierCount ?? 0,
			activeCount: activeCount ?? 0,
			photoCount: photoCount ?? 0,
			lastActivity: lastPhoto?.created_at ?? null
		},
		recentChantiers: (recent ?? []).map((c) => ({
			id: c.id as string,
			name: c.name as string,
			status: c.status as 'en_cours' | 'termine' | 'en_attente',
			progress: c.progress as number,
			createdAt: c.created_at as string,
			photoCount: (c.chantier_photos as { count: number }[])[0]?.count ?? 0
		})),
		recommendations: (recommendations ?? [])
			.filter((r) => ((r.issues as string[]) ?? []).length > 0)
			.slice(0, 3)
			.map((r) => ({
				id: r.id as string,
				imagePath: r.image_path as string,
				description: r.description as string | null,
				issue: ((r.issues as string[]) ?? [])[0] ?? null,
				chantier: r.chantiers as unknown as { id: string; name: string } | null
			}))
	};
};
