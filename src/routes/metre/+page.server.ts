import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Authentification requise');
	const uid = locals.user.id;

	// Filtré sur l'utilisateur : un administrateur verrait sinon les mesures de tous les comptes.
	const [mesures, chantiers] = await Promise.all([
		locals.supabase
			.from('mesures')
			.select('id, label, value, created_at, chantier_id, chantiers(name)')
			.eq('user_id', uid)
			.eq('kind', 'surface')
			.order('created_at', { ascending: false })
			.limit(30),
		locals.supabase.from('chantiers').select('id, name').eq('user_id', uid).order('name')
	]);
	if (mesures.error || chantiers.error) throw error(500, 'Impossible de charger les mesures');

	return {
		chantiers: chantiers.data ?? [],
		surfaces: (mesures.data ?? []).map((m) => ({
			id: m.id as string,
			label: (m.label as string | null) ?? 'Surface',
			value: Number(m.value),
			chantierId: m.chantier_id as string | null,
			chantierName: (m.chantiers as unknown as { name: string } | null)?.name ?? null
		}))
	};
};
