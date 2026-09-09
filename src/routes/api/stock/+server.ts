import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/services/supabase';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const { item, quantity, recordedOn, chantierId } = body ?? {};

	if (!item || typeof item !== 'string' || !item.trim()) {
		return json({ error: 'Matériau manquant' }, { status: 400 });
	}
	if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
		return json({ error: 'Quantité invalide' }, { status: 400 });
	}

	const { data, error } = await supabase
		.from('stock_history')
		.insert({
			item: item.trim(),
			quantity,
			recorded_on: recordedOn || new Date().toISOString().slice(0, 10),
			chantier_id: chantierId || null
		})
		.select()
		.single();

	if (error) {
		console.error('Erreur ajout stock:', error);
		return json({ error: "Échec de l'ajout" }, { status: 500 });
	}

	return json({ entry: data }, { status: 201 });
};
