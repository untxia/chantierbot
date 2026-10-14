import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Authentification requise');

	const [chantiers, mesures] = await Promise.all([
		locals.supabase.from('chantiers').select('id, name').order('name'),
		locals.supabase
			.from('mesures')
			.select('id, label, kind, value, method, created_at, chantiers(name)')
			.order('created_at', { ascending: false })
			.limit(50)
	]);
	if (chantiers.error) throw error(500, 'Impossible de charger les chantiers');
	if (mesures.error) throw error(500, 'Impossible de charger les mesures');

	return {
		chantiers: chantiers.data ?? [],
		mesures: (mesures.data ?? []).map((m) => ({
			id: m.id as string,
			label: m.label as string | null,
			kind: m.kind as 'longueur' | 'surface',
			value: Number(m.value),
			method: m.method as 'ar' | 'photo',
			createdAt: m.created_at as string,
			chantierName: (m.chantiers as unknown as { name: string } | null)?.name ?? null
		}))
	};
};
