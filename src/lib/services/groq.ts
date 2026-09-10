import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '$env/static/private';
import { getTradeProfile, type TradeId } from '$lib/config/trades';

const TEXT_MODEL = 'openai/gpt-oss-120b';
const VISION_MODEL = 'qwen/qwen3.8-27b';
const groq = new Groq({ apiKey: GROQ_API_KEY });

export interface EstimateLine { description: string; quantity: number; unit: string; unitPrice: number; total: number; type: 'material' | 'labor'; }
export interface WorkEstimate { trade: string; title: string; lines: EstimateLine[]; totalMaterials: number; totalLabor: number; total: number; confidence: 'faible' | 'moyenne' | 'bonne'; notes: string[]; }
export interface PhotoAnalysis {
	description: string;
	issues: string[];
	materials: string[];
	progressEstimate: string | null;
	detectedWorks: string[];
	quantities: { item: string; quantity: number; unit: string }[];
	estimate: WorkEstimate;
}

function normalizeEstimate(value: unknown, trade: string): WorkEstimate {
	const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
	const rawLines = Array.isArray(source.lines) ? source.lines : [];
	const lines: EstimateLine[] = rawLines.map((line) => {
		const l = (line && typeof line === 'object' ? line : {}) as Record<string, unknown>;
		const quantity = Number(l.quantity) || 0;
		const unitPrice = Number(l.unitPrice) || 0;
		return { description: String(l.description ?? 'Poste à préciser'), quantity, unit: String(l.unit ?? 'u'), unitPrice, total: Number(l.total) || quantity * unitPrice, type: l.type === 'labor' ? 'labor' : 'material' };
	}).filter((line) => line.quantity > 0 && line.unitPrice >= 0);
	const totalMaterials = lines.filter((l) => l.type === 'material').reduce((sum, l) => sum + l.total, 0);
	const totalLabor = lines.filter((l) => l.type === 'labor').reduce((sum, l) => sum + l.total, 0);
	return { trade, title: String(source.title ?? `Estimation ${trade}`), lines, totalMaterials, totalLabor, total: totalMaterials + totalLabor, confidence: source.confidence === 'bonne' || source.confidence === 'moyenne' ? source.confidence : 'faible', notes: Array.isArray(source.notes) ? source.notes.map(String).slice(0, 6) : [] };
}

export async function analyzePhoto(imageDataUrl: string, context?: string, tradeId?: TradeId): Promise<PhotoAnalysis> {
	const profile = getTradeProfile(tradeId);
	const prompt = `Tu es un assistant IA pour artisans du bâtiment. Analyse cette photo de chantier pour le métier « ${profile.label} ».\nConcentre-toi sur : ${profile.focus.join(', ')}.\nUnités possibles : ${profile.units.join(', ')}.\n${context ? `Contexte fourni par l'artisan : ${context}` : ''}\n\nIMPORTANT : une photo ne permet pas toujours de mesurer précisément. N'invente pas une mesure certaine : utilise une estimation prudente et indique les éléments à vérifier.\nRéponds UNIQUEMENT avec un JSON valide : {"description":"description courte","issues":["anomalies visibles"],"materials":["matériaux/outils visibles"],"progressEstimate":"avancement ou null","detectedWorks":["travaux identifiés"],"quantities":[{"item":"élément","quantity":0,"unit":"m²"}]}`;
	const res = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` }, body: JSON.stringify({ model: VISION_MODEL, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageDataUrl } }] }], temperature: 0.2, response_format: { type: 'json_object' } }) });
	if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`Groq vision API error (${res.status}): ${body}`); }
	const data = await res.json();
	const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
	const detectedWorks = Array.isArray(parsed.detectedWorks) ? parsed.detectedWorks.map(String) : [];
	const quantities = Array.isArray(parsed.quantities) ? parsed.quantities.map((q: Record<string, unknown>) => ({ item: String(q.item ?? ''), quantity: Number(q.quantity) || 0, unit: String(q.unit ?? 'u') })).filter((q: { item: string; quantity: number }) => q.item && q.quantity > 0) : [];
	const base = { description: String(parsed.description ?? ''), issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [], materials: Array.isArray(parsed.materials) ? parsed.materials.map(String) : [], progressEstimate: parsed.progressEstimate ? String(parsed.progressEstimate) : null, detectedWorks, quantities };
	let estimate: WorkEstimate;
	try { estimate = await buildEstimate(profile.label, base, profile.units); } catch (error) {
		console.error('Erreur génération estimation IA:', error);
		estimate = { trade: profile.label, title: `Analyse ${profile.label}`, lines: [], totalMaterials: 0, totalLabor: 0, total: 0, confidence: 'faible', notes: ['L’estimation chiffrée n’a pas pu être générée. Relancez l’analyse ou complétez les quantités manuellement.'] };
	}
	return { ...base, estimate };
}

async function buildEstimate(trade: string, analysis: Omit<PhotoAnalysis, 'estimate'>, units: string[]): Promise<WorkEstimate> {
	const prompt = `Tu es un métreur assistant pour l'artisan « ${trade} ». À partir de cette analyse visuelle :\n${JSON.stringify(analysis)}\n\nGénère une estimation indicative exploitable pour préparer un devis. Utilise des prix unitaires moyens indicatifs en euros HT, sans prétendre à un prix réel fournisseur. Sépare matériaux et main-d'œuvre. Ne crée un poste que si l'analyse donne un indice raisonnable. Les quantités issues d'une photo restent approximatives. Unités autorisées : ${units.join(', ')}.\nRéponds UNIQUEMENT en JSON : {"title":"...","lines":[{"description":"...","quantity":1,"unit":"m²","unitPrice":25,"total":25,"type":"material"}],"confidence":"faible|moyenne|bonne","notes":["..."]}`;
	const completion = await groq.chat.completions.create({ model: TEXT_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.15, response_format: { type: 'json_object' } });
	return normalizeEstimate(JSON.parse(completion.choices[0]?.message?.content ?? '{}'), trade);
}

export interface StockHistoryEntry { item: string; date: string; quantity: number; }
export interface StockPrediction { item: string; daysRemaining: number; recommendation: string; }
export async function predictStock(history: StockHistoryEntry[]): Promise<StockPrediction[]> {
	const prompt = `Tu es un assistant de gestion de stock pour artisans du bâtiment. Voici l'historique de consommation de matériaux au format JSON :\n${JSON.stringify(history)}\n\nPrédis, pour chaque matériau distinct, le nombre de jours restants avant rupture de stock et une recommandation courte (réapprovisionner, quantité suggérée, etc.). Réponds UNIQUEMENT avec un JSON valide au format :\n{"predictions": [{"item": "nom du matériau", "daysRemaining": 0, "recommendation": "..."}]}`;
	const completion = await groq.chat.completions.create({ model: TEXT_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.2, response_format: { type: 'json_object' } });
	const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
	return Array.isArray(parsed.predictions) ? parsed.predictions : [];
}
