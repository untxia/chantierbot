import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '$env/static/private';

const TEXT_MODEL = 'openai/gpt-oss-120b';
const VISION_MODEL = 'qwen/qwen3.8-27b';

const groq = new Groq({ apiKey: GROQ_API_KEY });

export interface PhotoAnalysis {
	description: string;
	issues: string[];
	materials: string[];
	progressEstimate: string | null;
}

export async function analyzePhoto(imageDataUrl: string, context?: string): Promise<PhotoAnalysis> {
	const prompt = `Tu es un assistant pour artisans du bâtiment. Analyse cette photo de chantier${
		context ? ` (contexte fourni par l'artisan : ${context})` : ''
	} et réponds UNIQUEMENT avec un JSON valide au format :
{"description": "description courte de ce que tu vois", "issues": ["problèmes ou anomalies visibles"], "materials": ["matériaux/outils identifiés"], "progressEstimate": "estimation de l'avancement des travaux ou null"}`;

	// groq-sdk 0.3.x ne type pas encore les messages multimodaux (image_url),
	// on appelle donc l'API REST (compatible OpenAI) directement pour la vision.
	const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${GROQ_API_KEY}`
		},
		body: JSON.stringify({
			model: VISION_MODEL,
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: prompt },
						{ type: 'image_url', image_url: { url: imageDataUrl } }
					]
				}
			],
			temperature: 0.3,
			response_format: { type: 'json_object' }
		})
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Groq vision API error (${res.status}): ${body}`);
	}

	const data = await res.json();
	const raw = data.choices?.[0]?.message?.content ?? '{}';
	const parsed = JSON.parse(raw);

	return {
		description: parsed.description ?? '',
		issues: Array.isArray(parsed.issues) ? parsed.issues : [],
		materials: Array.isArray(parsed.materials) ? parsed.materials : [],
		progressEstimate: parsed.progressEstimate ?? null
	};
}

export interface StockHistoryEntry {
	item: string;
	date: string;
	quantity: number;
}

export interface StockPrediction {
	item: string;
	daysRemaining: number;
	recommendation: string;
}

export async function predictStock(history: StockHistoryEntry[]): Promise<StockPrediction[]> {
	const prompt = `Tu es un assistant de gestion de stock pour artisans du bâtiment. Voici l'historique de consommation de matériaux au format JSON :
${JSON.stringify(history)}

Prédis, pour chaque matériau distinct, le nombre de jours restants avant rupture de stock et une recommandation courte (réapprovisionner, quantité suggérée, etc.). Réponds UNIQUEMENT avec un JSON valide au format :
{"predictions": [{"item": "nom du matériau", "daysRemaining": 0, "recommendation": "..."}]}`;

	const completion = await groq.chat.completions.create({
		model: TEXT_MODEL,
		messages: [{ role: 'user', content: prompt }],
		temperature: 0.2,
		response_format: { type: 'json_object' }
	});

	const raw = completion.choices[0]?.message?.content ?? '{}';
	const parsed = JSON.parse(raw);

	return Array.isArray(parsed.predictions) ? parsed.predictions : [];
}
