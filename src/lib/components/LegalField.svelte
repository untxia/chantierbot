<script lang="ts">
	/** Affiche la valeur, ou un repère visible « à compléter » si elle est vide. */
	export let value = '';
	export let label = '';
</script>

{#if value.trim()}{value}{:else}<mark class="legal-todo">[à compléter : {label}]</mark>{/if}
