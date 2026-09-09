import { error } from '@sveltejs/kit';
import { supabase } from '$lib/services/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { data: chantier, error: chantierError } = await supabase
		.from('chantiers')
		.select('id, name, status, progress, created_at')
		.eq('id', params.id)
		.single();

	if (chantierError || !chantier) throw error(404, 'Chantier introuvable');

	const { data: photos, error: photosError } = await supabase
		.from('chantier_photos')
		.select('*')
		.eq('chantier_id', params.id)
		.order('created_at', { ascending: false });

	if (photosError) throw photosError;

	return {
		chantier,
		photos: photos ?? []
	};
};
