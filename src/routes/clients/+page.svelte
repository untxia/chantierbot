<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';

	type Client = { id: string; name: string; email: string | null; phone: string | null; address: string | null; created_at: string };
	let clients: Client[] = [];
	let loading = true;
	let saving = false;
	let search = '';
	let editingId: string | null = null;
	let name = '';
	let email = '';
	let phone = '';
	let address = '';

	async function loadClients() {
		loading = true;
		try {
			const res = await fetch(`/api/clients${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Impossible de charger les clients.');
			clients = body.clients ?? [];
		} catch (error) { toast.error(error instanceof Error ? error.message : 'Erreur.'); } finally { loading = false; }
	}

	onMount(loadClients);

	function resetForm() { editingId = null; name = ''; email = ''; phone = ''; address = ''; }
	function edit(client: Client) { editingId = client.id; name = client.name; email = client.email ?? ''; phone = client.phone ?? ''; address = client.address ?? ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }

	async function save() {
		if (!name.trim()) return;
		saving = true;
		try {
			const res = await fetch(editingId ? `/api/clients/${editingId}` : '/api/clients', {
				method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, phone, address })
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error ?? 'Enregistrement impossible.');
			toast.success(editingId ? 'Client modifié.' : 'Client créé.');
			resetForm();
			await loadClients();
		} catch (error) { toast.error(error instanceof Error ? error.message : 'Erreur.'); } finally { saving = false; }
	}

	async function remove(id: string) {
		if (!confirm('Supprimer ce client ?')) return;
		const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
		if (!res.ok) { toast.error((await res.json()).error ?? 'Suppression impossible.'); return; }
		toast.success('Client supprimé.');
		if (editingId === id) resetForm();
		await loadClients();
	}
</script>

<svelte:head><title>ChantierBot — Clients</title></svelte:head>

<div class="mx-auto max-w-6xl">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p class="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">CRM artisan</p><h1 class="text-2xl font-bold">Clients</h1><p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Centralise tes contacts et prépare le rattachement aux chantiers.</p></div><a href="/projets" class="btn-secondary">🚧 Voir les chantiers</a></div>

	<section class="card mb-8 p-6">
		<div class="mb-4 flex items-center justify-between gap-3"><h2 class="text-lg font-bold">{editingId ? 'Modifier le client' : 'Nouveau client'}</h2>{#if editingId}<button class="text-sm font-semibold text-ink-secondary hover:text-primary" on:click={resetForm} type="button">Annuler</button>{/if}</div>
		<form on:submit|preventDefault={save} class="grid gap-4 sm:grid-cols-2">
			<div class="sm:col-span-2"><label for="client-name" class="mb-1 block text-sm font-semibold">Nom / entreprise *</label><input id="client-name" class="input" bind:value={name} required placeholder="Ex. Mme Dupont" /></div>
			<div><label for="client-email" class="mb-1 block text-sm font-semibold">Email</label><input id="client-email" class="input" type="email" bind:value={email} placeholder="client@email.fr" /></div>
			<div><label for="client-phone" class="mb-1 block text-sm font-semibold">Téléphone</label><input id="client-phone" class="input" type="tel" bind:value={phone} placeholder="06 00 00 00 00" /></div>
			<div class="sm:col-span-2"><label for="client-address" class="mb-1 block text-sm font-semibold">Adresse</label><textarea id="client-address" class="input min-h-24" bind:value={address} placeholder="Adresse du client"></textarea></div>
			<div class="sm:col-span-2"><button class="btn-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Ajouter le client'}</button></div>
		</form>
	</section>

	<div class="mb-4 flex flex-col gap-3 sm:flex-row"><input class="input flex-1" bind:value={search} on:keydown={(e) => e.key === 'Enter' && loadClients()} placeholder="Rechercher un client..." aria-label="Rechercher un client" /><button class="btn-secondary" type="button" on:click={loadClients}>Rechercher</button></div>

	{#if loading}<p class="text-sm text-ink-secondary">Chargement...</p>{:else if clients.length === 0}<div class="card p-8 text-center"><p class="text-lg font-bold">Aucun client</p><p class="mt-1 text-sm text-ink-secondary">Ajoute ton premier client ci-dessus.</p></div>{:else}<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{#each clients as client (client.id)}<article class="card"><div class="flex items-start justify-between gap-3"><div><h2 class="font-bold">{client.name}</h2>{#if client.email}<p class="mt-1 text-sm text-ink-secondary">✉️ {client.email}</p>{/if}{#if client.phone}<p class="mt-1 text-sm text-ink-secondary">📞 {client.phone}</p>{/if}{#if client.address}<p class="mt-2 whitespace-pre-line text-sm text-ink-secondary">📍 {client.address}</p>{/if}</div><span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">Client</span></div><div class="mt-5 flex gap-2"><button type="button" class="btn-secondary flex-1" on:click={() => edit(client)}>Modifier</button><button type="button" class="rounded-lg border border-danger/20 px-3 py-2 text-sm font-bold text-danger hover:bg-danger/5" on:click={() => remove(client.id)}>Supprimer</button></div></article>{/each}</div>{/if}
</div>
