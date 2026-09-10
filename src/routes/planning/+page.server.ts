import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Authentification requise');
	const [{ data: rendezVous, error: rvError }, { data: chantiers, error: chantierError }, { data: clients, error: clientError }] = await Promise.all([
		locals.supabase.from('rendez_vous').select('*').order('start_at'),
		locals.supabase.from('chantiers').select('id,name,status,progress,start_date,end_date,client_id').order('name'),
		locals.supabase.from('clients').select('id,name').order('name')
	]);
	if (rvError) throw error(500, 'Impossible de charger le planning');
	if (chantierError || clientError) throw error(500, 'Impossible de charger les données du planning');
	return { rendezVous: rendezVous ?? [], chantiers: chantiers ?? [], clients: clients ?? [] };
};
