import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzePhoto } from '$lib/services/groq';
import { supabase } from '$lib/services/supabase';
import type { TradeId } from '$lib/config/trades';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const { chantierId, imagePath, imageUrl, context, tradeId } = body ?? {};

	if (!chantierId || typeof chantierId !== 'string') return json({ error: 'chantierId manquant' }, { status: 400 });
	if (!imagePath || typeof imagePath !== 'string' || !imageUrl || typeof imageUrl !== 'string') return json({ error: 'imagePath / imageUrl manquant' }, { status: 400 });

	try {
		const analysis = await analyzePhoto(imageUrl, context, typeof tradeId === 'string' ? tradeId as TradeId : 'general');
		const { data, error } = await supabase.from('chantier_photos').insert({
			chantier_id: chantierId,
			image_path: imagePath,
			description: analysis.description,
			issues: analysis.issues,
			materials: analysis.materials,
			progress_estimate: analysis.progressEstimate
		}).select().single();
		if (error) throw error;
		return json({ photo: data, analysis });
	} catch (err) {
		console.error('Erreur analyse photo:', err);
		await supabase.from('chantier_photos').insert({ chantier_id: chantierId, image_path: imagePath, error: err instanceof Error ? err.message : "Échec de l'analyse" });
		return json({ error: "Échec de l'analyse de la photo" }, { status: 500 });
	}
};
