import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Authentification requise');
	const supabase = locals.supabase;
	// Filtré sur l'utilisateur : un administrateur verrait sinon les données de tous les comptes.
	const uid = locals.user.id;
	const [{ data: chantiers, error: chantiersError }, { data: history, error: historyError }] = await Promise.all([
		supabase.from('chantiers').select('id, name').eq('user_id', uid).order('name'),
		supabase
			.from('stock_history')
			.select('id, item, quantity, recorded_on, chantiers(name)')
			.eq('user_id', uid)
			.order('recorded_on', { ascending: false })
			.limit(50)
	]);

	if (chantiersError) throw chantiersError;
	if (historyError) throw historyError;

	return {
		chantiers: chantiers ?? [],
		history: (history ?? []).map((h) => ({
			id: h.id as string,
			item: h.item as string,
			quantity: h.quantity as number,
			recordedOn: h.recorded_on as string,
			chantierName: (h.chantiers as unknown as { name: string } | null)?.name ?? null
		}))
	};
};
