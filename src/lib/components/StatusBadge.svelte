<script lang="ts">
	export let status: 'en_cours' | 'termine' | 'en_attente';

	const labels = { en_cours: 'En cours', termine: 'Terminé', en_attente: 'En attente' };
	const styles = {
		en_cours: 'bg-primary/10 text-primary',
		termine: 'bg-success/10 text-success',
		en_attente: 'bg-warning/10 text-warning'
	};
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold {styles[status]}">
	{labels[status]}
</span>
