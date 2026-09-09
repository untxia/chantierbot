import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';

const VALID_STATUSES = ['en_cours', 'termine', 'en_attente'];

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	const status = body?.status;

	if (!VALID_STATUSES.includes(status)) {
		return json({ error: 'Statut invalide' }, { status: 400 });
	}

	const { data, error } = await supabase.from('chantiers').update({ status }).eq('id', params.id).select().single();

	if (error) {
		console.error('Erreur mise à jour statut:', error);
		return json({ error: 'Échec de la mise à jour' }, { status: 500 });
	}

	return json({ chantier: data });
};
