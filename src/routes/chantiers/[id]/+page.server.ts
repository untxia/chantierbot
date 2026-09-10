import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Authentification requise');
	const supabase = locals.supabase;

	const { data: chantier, error: chantierError } = await supabase
		.from('chantiers')
		.select('id, name, description, address, client_id, start_date, end_date, budget, status, progress, created_at, updated_at')
		.eq('id', params.id)
		.single();
	if (chantierError || !chantier) throw error(404, 'Chantier introuvable');

	let client = null;
	if (chantier.client_id) {
		const { data } = await supabase.from('clients').select('id, name, email, phone, address').eq('id', chantier.client_id).single();
		client = data;
	}

	const { data: photos, error: photosError } = await supabase
		.from('chantier_photos')
		.select('*')
		.eq('chantier_id', params.id)
		.order('created_at', { ascending: false });
	if (photosError) throw photosError;

	const photosWithUrls = await Promise.all((photos ?? []).map(async (photo) => {
		const { data: signed } = await supabase.storage.from('chantier-photos').createSignedUrl(photo.image_path, 3600);
		return { ...photo, image_url: signed?.signedUrl ?? null };
	}));

	return { chantier, client, photos: photosWithUrls };
};
