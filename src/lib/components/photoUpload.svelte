<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { uploadPhoto, photoPublicUrl } from '$lib/services/supabase';
	import { toast } from '$lib/stores/toast';
	import Mascot from './Mascot.svelte';

	export let chantierId: string;

	let loading = false;
	let mascotState: 'idle' | 'working' | 'success' | 'error' = 'idle';
	let statusMessage = '';

	async function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		loading = true;
		mascotState = 'working';
		statusMessage = 'Envoi et analyse de la photo en cours...';

		try {
			const extension = file.name.split('.').pop() || 'jpg';
			const path = await uploadPhoto(chantierId, file, extension);
			const imageUrl = photoPublicUrl(path);

			const res = await fetch('/api/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chantierId, imagePath: path, imageUrl })
			});

			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Erreur serveur');

			mascotState = 'success';
			statusMessage = 'Analyse terminée.';
			toast.success('Photo analysée avec succès.');
			await invalidateAll();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erreur inconnue';
			mascotState = 'error';
			statusMessage = `Échec de l'analyse : ${message}`;
			toast.error(message);
		} finally {
			loading = false;
			input.value = '';
			setTimeout(() => (mascotState = 'idle'), 2000);
		}
	}
</script>

<div class="mb-8 flex flex-col gap-2">
	<label for="photo-input" class="font-semibold">
		Ajouter une photo de chantier
		<span class="badge-ai ml-1 align-middle">✨ IA</span>
	</label>
	<div class="flex items-center gap-3">
		<Mascot state={mascotState} />
		<input
			id="photo-input"
			type="file"
			accept="image/*"
			on:change={handleFileChange}
			disabled={loading}
			aria-busy={loading}
			class="input flex-1 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-white disabled:opacity-50"
		/>
	</div>
	<p class="min-h-[1.2em] text-sm text-ink-secondary dark:text-ink-dark-secondary" aria-live="polite">{statusMessage}</p>
</div>
