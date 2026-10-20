import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAuthCookies } from '$lib/services/auth';

const PHOTOS_BUCKET = 'chantier-photos';
const CONFIRMATION_WORD = 'SUPPRIMER';

/**
 * Droit à l'effacement (RGPD art. 17).
 * 1. essai à blanc de delete_my_account() : vérifie que la fonction existe et que le compte
 *    peut être supprimé (refus du dernier administrateur) AVANT d'effacer quoi que ce soit ;
 * 2. supprime les fichiers du stockage (la base ne peut pas le faire) ;
 * 3. supprime le compte via delete_my_account(), les données partent en cascade.
 *
 * Toutes les lectures sont filtrées sur l'utilisateur : un administrateur verrait sinon
 * les données des autres comptes.
 */
export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
	const body = await request.json().catch(() => null);
	if (body?.confirm !== CONFIRMATION_WORD) {
		return json({ error: `Tapez ${CONFIRMATION_WORD} pour confirmer la suppression.` }, { status: 400 });
	}

	const db = locals.supabase;
	const uid = locals.user.id;

	// 1. Essai à blanc : rien n'est supprimé si la fonction manque ou si le compte ne peut pas l'être.
	const dry = await db.rpc('delete_my_account', { dry_run: true });
	if (dry.error) {
		if (dry.error.message?.includes('last_admin')) {
			return json({ error: 'Vous êtes le seul administrateur. Nommez un autre administrateur avant de supprimer ce compte.' }, { status: 409 });
		}
		console.error('Suppression de compte indisponible:', dry.error);
		return json({ error: 'La suppression de compte n’est pas disponible pour le moment. Aucune donnée n’a été supprimée.' }, { status: 503 });
	}

	// 2. Fichiers photo : chemins connus + contenu des dossiers de chantier.
	const [{ data: photos }, { data: chantiers }] = await Promise.all([
		db.from('chantier_photos').select('image_path').eq('user_id', uid),
		db.from('chantiers').select('id').eq('user_id', uid)
	]);

	const paths = new Set<string>((photos ?? []).map((p) => p.image_path as string));
	for (const c of chantiers ?? []) {
		const { data: files } = await db.storage.from(PHOTOS_BUCKET).list(c.id as string, { limit: 1000 });
		for (const f of files ?? []) if (f.name) paths.add(`${c.id}/${f.name}`);
	}

	const all = [...paths];
	for (let i = 0; i < all.length; i += 100) {
		const { error } = await db.storage.from(PHOTOS_BUCKET).remove(all.slice(i, i + 100));
		if (error) {
			console.error('Erreur suppression photos (compte):', error);
			return json({ error: 'Suppression des photos impossible. Rien d’autre n’a été supprimé, réessayez.' }, { status: 500 });
		}
	}

	// 3. Compte et données en cascade.
	const { error } = await db.rpc('delete_my_account', { dry_run: false });
	if (error) {
		console.error('Erreur suppression compte:', error);
		if (error.message?.includes('last_admin')) {
			return json({ error: 'Vous êtes le seul administrateur. Nommez-en un autre avant de supprimer ce compte.' }, { status: 409 });
		}
		return json({ error: 'Suppression du compte impossible. Contactez le support.' }, { status: 500 });
	}

	clearAuthCookies(cookies);
	return json({ ok: true });
};
