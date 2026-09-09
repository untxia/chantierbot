import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzePhoto } from '$lib/services/groq';
import { supabase } from '$lib/services/supabase';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const { chantierId, imagePath, imageUrl, context } = body ?? {};

	if (!chantierId || typeof chantierId !== 'string') {
		return json({ error: 'chantierId manquant' }, { status: 400 });
	}
	if (!imagePath || typeof imagePath !== 'string' || !imageUrl || typeof imageUrl !== 'string') {
		return json({ error: 'imagePath / imageUrl manquant' }, { status: 400 });
	}

	try {
		const analysis = await analyzePhoto(imageUrl, context);

		const { data, error } = await supabase
			.from('chantier_photos')
			.insert({
				chantier_id: chantierId,
				image_path: imagePath,
				description: analysis.description,
				issues: analysis.issues,
				materials: analysis.materials,
				progress_estimate: analysis.progressEstimate
			})
			.select()
			.single();

		if (error) throw error;

		return json({ photo: data });
	} catch (err) {
		console.error('Erreur analyse photo:', err);

		// On garde une trace de l'échec pour ne pas perdre la photo déjà uploadée.
		await supabase.from('chantier_photos').insert({
			chantier_id: chantierId,
			image_path: imagePath,
			error: err instanceof Error ? err.message : "Échec de l'analyse"
		});

		return json({ error: "Échec de l'analyse de la photo" }, { status: 500 });
	}
};
