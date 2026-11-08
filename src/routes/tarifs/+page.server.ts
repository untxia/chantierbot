import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw error(401, 'Authentification requise');
	const { data, error: e } = await locals.supabase
		.from('tarifs')
		.select('id, fournisseur, date_tarif, fichier, created_at, tarif_lignes(count)')
		.eq('user_id', locals.user.id)
		.order('created_at', { ascending: false });
	// Table absente (migration non appliquée) : la page l'indique au lieu de planter.
	if (e) return { tarifs: [], indisponible: true };
	return {
		indisponible: false,
		tarifs: (data ?? []).map((t) => ({
			id: t.id as string,
			fournisseur: t.fournisseur as string,
			dateTarif: t.date_tarif as string | null,
			fichier: t.fichier as string | null,
			importeLe: t.created_at as string,
			lignes: (t.tarif_lignes as unknown as { count: number }[])?.[0]?.count ?? 0
		}))
	};
};
