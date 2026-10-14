import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Authentification requise');

	const { data, error: queryError } = await locals.supabase
		.from('chantier_photos')
		.select('id, image_path, description, issues, materials, progress_estimate, error, created_at, chantiers(id, name)')
		.order('created_at', { ascending: false })
		.limit(30);

	if (queryError) throw error(500, 'Impossible de charger les analyses');

	// Le bucket est privé : on signe chaque URL (valable 1 h).
	const activity = await Promise.all(
		(data ?? []).map(async (p) => {
			const { data: signed } = await locals.supabase.storage.from('chantier-photos').createSignedUrl(p.image_path as string, 3600);
			return {
				id: p.id as string,
				imagePath: p.image_path as string,
				imageUrl: signed?.signedUrl ?? null,
				description: p.description as string | null,
				issues: (p.issues as string[]) ?? [],
				materials: (p.materials as string[]) ?? [],
				progressEstimate: p.progress_estimate as string | null,
				error: p.error as string | null,
				createdAt: p.created_at as string,
				chantier: p.chantiers as unknown as { id: string; name: string } | null
			};
		})
	);

	return { activity };
};
