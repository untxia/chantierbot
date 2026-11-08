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

	// Fournitures reliées à une ligne de tarif fournisseur (table absente = tarifs non activés).
	const assoc = await locals.supabase
		.from('tarif_associations')
		.select('code_fourniture, tarif_lignes(id, designation, prix_ht, tva, unite, tarifs(fournisseur, date_tarif, created_at))')
		.eq('user_id', uid);
	type LigneAssociee = {
		id: string;
		designation: string;
		prix_ht: number;
		tva: number;
		tarifs: { fournisseur: string; date_tarif: string | null; created_at: string } | null;
	};

	return {
		tarifsDisponibles: !assoc.error,
		associations: (assoc.data ?? [])
			.map((a) => ({ cle: a.code_fourniture as string, ligne: a.tarif_lignes as unknown as LigneAssociee | null }))
			.filter((a) => a.ligne)
			.map((a) => ({
				cle: a.cle,
				ligneId: a.ligne!.id,
				designation: a.ligne!.designation,
				prixHT: Number(a.ligne!.prix_ht),
				tva: Number(a.ligne!.tva),
				fournisseur: a.ligne!.tarifs?.fournisseur ?? '',
				dateTarif: a.ligne!.tarifs?.date_tarif ?? a.ligne!.tarifs?.created_at ?? null
			})),
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
