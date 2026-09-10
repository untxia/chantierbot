import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const supabase = locals.supabase;
	const { data: chantier, error: chantierError } = await supabase.from('chantiers').select('id, name, status, progress, created_at').eq('id', params.id).single();
	if (chantierError || !chantier) throw error(404, 'Chantier introuvable');

	const { data: photos, error: photosError } = await supabase.from('chantier_photos').select('*').eq('chantier_id', params.id).order('created_at', { ascending: false });
	if (photosError) throw photosError;

	const photosWithUrls = await Promise.all((photos ?? []).map(async (photo) => {
		const { data: signed } = await supabase.storage.from('chantier-photos').createSignedUrl(photo.image_path, 3600);
		return { ...photo, image_url: signed?.signedUrl ?? null };
	}));

	return { chantier, photos: photosWithUrls };
};
