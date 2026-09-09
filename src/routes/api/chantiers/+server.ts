import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const name = body?.name;

	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Nom du chantier manquant' }, { status: 400 });
	}

	const { data, error } = await supabase.from('chantiers').insert({ name: name.trim() }).select().single();

	if (error) {
		console.error('Erreur création chantier:', error);
		return json({ error: 'Échec de la création du chantier' }, { status: 500 });
	}

	return json({ chantier: data }, { status: 201 });
};
