import { supabase } from '$lib/services/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { data, error } = await supabase
		.from('chantier_photos')
		.select('id, image_path, description, issues, materials, progress_estimate, error, created_at, chantiers(id, name)')
		.order('created_at', { ascending: false })
		.limit(30);

	if (error) throw error;

	return {
		activity: (data ?? []).map((p) => ({
			id: p.id as string,
			imagePath: p.image_path as string,
			description: p.description as string | null,
			issues: (p.issues as string[]) ?? [],
			materials: (p.materials as string[]) ?? [],
			progressEstimate: p.progress_estimate as string | null,
			error: p.error as string | null,
			createdAt: p.created_at as string,
			chantier: p.chantiers as unknown as { id: string; name: string } | null
		}))
	};
};
