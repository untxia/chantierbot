import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PHOTOS_BUCKET = 'chantier-photos';
const SIGNED_URL_SECONDS = 7 * 24 * 3600;

/**
 * Droit à la portabilité (RGPD art. 20) : export JSON de toutes les données de l'utilisateur.
 *
 * Attention : un administrateur voit TOUTES les lignes via les politiques « admin_all ».
 * Chaque requête est donc filtrée explicitement sur l'identifiant de l'utilisateur.
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const db = locals.supabase;
	const uid = locals.user.id;

	const own = (table: string) => db.from(table).select('*').eq('user_id', uid);

	const [profile, clients, chantiers, photos, notes, fournisseurs, commandes, lignes, relances, rendezVous, stock, mesures] =
		await Promise.all([
			db.from('profiles').select('*').eq('id', uid).maybeSingle(),
			own('clients'),
			own('chantiers'),
			own('chantier_photos'),
			own('chantier_notes'),
			own('fournisseurs'),
			own('commandes'),
			own('commande_lignes'),
			own('relances'),
			own('rendez_vous'),
			own('stock_history'),
			own('mesures')
		]);

	const failed = [profile, clients, chantiers, photos, notes, fournisseurs, commandes, lignes, relances, rendezVous, stock, mesures].find(
		(r) => r.error
	);
	if (failed?.error) {
		console.error('Erreur export RGPD:', failed.error);
		return json({ error: "Impossible de préparer l'export." }, { status: 500 });
	}

	// Liens temporaires vers les fichiers photo (le bucket est privé).
	const photoRows = (photos.data ?? []) as { image_path: string }[];
	const urlByPath = new Map<string, string>();
	if (photoRows.length > 0) {
		const { data: signed } = await db.storage
			.from(PHOTOS_BUCKET)
			.createSignedUrls(photoRows.map((p) => p.image_path), SIGNED_URL_SECONDS);
		for (const s of signed ?? []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
	}

	const lignesByCommande = new Map<string, unknown[]>();
	for (const l of (lignes.data ?? []) as { commande_id: string }[]) {
		lignesByCommande.set(l.commande_id, [...(lignesByCommande.get(l.commande_id) ?? []), l]);
	}

	const exportedAt = new Date();
	const body = {
		format: 'chantierbot-export-v1',
		exportedAt: exportedAt.toISOString(),
		note: `Export de vos données personnelles. Les liens des photos (photos[].lien_temporaire) expirent après 7 jours.`,
		compte: { id: uid, email: locals.user.email ?? null, creeLe: locals.user.created_at ?? null },
		profil: profile.data,
		clients: clients.data,
		chantiers: chantiers.data,
		notes_de_chantier: notes.data,
		photos: photoRows.map((p) => ({ ...p, lien_temporaire: urlByPath.get(p.image_path) ?? null })),
		fournisseurs: fournisseurs.data,
		commandes: ((commandes.data ?? []) as { id: string }[]).map((c) => ({ ...c, lignes: lignesByCommande.get(c.id) ?? [] })),
		relances: relances.data,
		rendez_vous: rendezVous.data,
		historique_de_stock: stock.data,
		mesures: mesures.data
	};

	return new Response(JSON.stringify(body, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="chantierbot-export-${exportedAt.toISOString().slice(0, 10)}.json"`,
			'Cache-Control': 'no-store'
		}
	});
};
