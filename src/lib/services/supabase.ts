import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export interface ChantierRow {
	id: string;
	name: string;
	created_at: string;
}

export interface ChantierPhotoRow {
	id: string;
	chantier_id: string;
	image_path: string;
	description: string | null;
	issues: string[];
	materials: string[];
	progress_estimate: string | null;
	error: string | null;
	created_at: string;
}

const PHOTOS_BUCKET = 'chantier-photos';

export function photoPublicUrl(path: string): string {
	return supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function photoSignedUrl(path: string, expiresIn = 3600): Promise<string> {
	const { data, error } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrl(path, expiresIn);
	if (error || !data?.signedUrl) throw error ?? new Error('Impossible de générer l’URL de la photo.');
	return data.signedUrl;
}

export async function uploadPhoto(chantierId: string, file: Blob, extension: string): Promise<string> {
	const path = `${chantierId}/${crypto.randomUUID()}.${extension}`;
	const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, { contentType: file.type });
	if (error) throw error;
	return path;
}
