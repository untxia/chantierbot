import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { predictStock } from '$lib/services/groq';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const history = body?.history;

	if (!Array.isArray(history) || history.length === 0) {
		return json({ error: "Historique de stock manquant ou vide (attendu : tableau 'history')" }, { status: 400 });
	}

	try {
		const predictions = await predictStock(history);
		return json({ predictions });
	} catch (err) {
		console.error('Erreur prédiction stock:', err);
		return json({ error: 'Échec de la prédiction de stock' }, { status: 500 });
	}
};
