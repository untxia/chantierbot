<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import { TRADES } from '$lib/config/trades';

	let displayName = '';
	let companyName = '';
	let tradeId = '';
	let phone = '';
	let email = '';
	let loading = true;
	let saving = false;
	let loggingOut = false;

	onMount(async () => {
		try {
			const res = await fetch('/api/profile');
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Impossible de charger le profil.');
			displayName = body.profile?.display_name ?? '';
			companyName = body.profile?.company_name ?? '';
			tradeId = body.profile?.trade_id ?? '';
			phone = body.profile?.phone ?? '';
			email = body.profile?.email ?? '';
		} catch (error) { toast.error(error instanceof Error ? error.message : 'Erreur de chargement.'); } finally { loading = false; }
	});

	async function save() {
		saving = true;
		try {
			const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName, companyName, tradeId, phone }) });
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Enregistrement impossible.');
			toast.success('Profil enregistré.');
		} catch (error) { toast.error(error instanceof Error ? error.message : 'Erreur.'); } finally { saving = false; }
	}

	async function logout() {
		loggingOut = true;
		await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
		goto('/connexion');
	}
</script>

<svelte:head><title>ChantierBot — Paramètres</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<div class="mb-6"><p class="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">Compte artisan</p><h1 class="text-2xl font-bold">Paramètres</h1><p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Gère ton profil et les informations affichées dans ChantierBot.</p></div>

	<section class="card p-6">
		{#if loading}<p class="text-sm text-ink-secondary">Chargement du profil...</p>{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				<div><label for="displayName" class="mb-1 block text-sm font-semibold">Nom / prénom</label><input id="displayName" class="input" bind:value={displayName} /></div>
				<div><label for="companyName" class="mb-1 block text-sm font-semibold">Entreprise</label><input id="companyName" class="input" bind:value={companyName} /></div>
				<div><label for="phone" class="mb-1 block text-sm font-semibold">Téléphone</label><input id="phone" class="input" bind:value={phone} type="tel" /></div>
				<div><label for="tradeId" class="mb-1 block text-sm font-semibold">Métier</label><select id="tradeId" class="input" bind:value={tradeId}><option value="">Choisir un métier</option>{#each TRADES as trade}<option value={trade.id}>{trade.label}</option>{/each}</select></div>
			</div>
			<div class="mt-4 rounded-xl bg-black/[0.03] p-4 text-sm dark:bg-white/[0.04]"><p class="font-semibold">Email du compte</p><p class="mt-1 text-ink-secondary dark:text-ink-dark-secondary">{email || 'Email géré par Supabase Auth'}</p></div>
			<div class="mt-6 flex flex-wrap justify-between gap-3"><button class="btn-secondary" type="button" on:click={logout} disabled={loggingOut}>{loggingOut ? 'Déconnexion...' : 'Se déconnecter'}</button><button class="btn-primary" type="button" on:click={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer le profil'}</button></div>
		{/if}
	</section>

	<div class="mt-6 flex gap-3"><a href="/clients" class="btn-secondary">👥 Gérer mes clients</a><a href="/projets" class="btn-secondary">🚧 Mes chantiers</a></div>
</div>
