<script lang="ts">
	import { toast } from '$lib/stores/toast';
	export let chantierId: string;
	export let redirectTo = '/projets';
	let deleting = false;

	async function remove() {
		if (!confirm('Supprimer définitivement ce chantier ? Cette action est irréversible.')) return;
		deleting = true;
		try {
			const res = await fetch(`/api/chantiers/${chantierId}`, { method: 'DELETE' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.error ?? 'Suppression impossible.');
			toast.success('Chantier supprimé.');
			window.location.href = redirectTo;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Erreur de suppression.');
		} finally { deleting = false; }
	}
</script>

<button type="button" on:click={remove} disabled={deleting} class="rounded-xl border border-danger/20 px-3 py-2 text-sm font-bold text-danger transition hover:bg-danger/5 disabled:opacity-50">
	{deleting ? 'Suppression…' : '🗑️ Supprimer'}
</button>
