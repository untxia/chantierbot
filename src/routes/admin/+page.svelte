<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	type Role = 'admin' | 'manager' | 'user';
	type Profile = { id: string; display_name: string | null; full_name: string | null; company_name: string | null; role: Role; created_at: string; disabled_at: string | null };
	type Stats = { users: number; admins: number; managers: number; clients: number; chantiers: number };
	let users: Profile[] = [];
	let stats: Stats = { users: 0, admins: 0, managers: 0, clients: 0, chantiers: 0 };
	let loading = true; let savingId = ''; let error = ''; let search = '';
	$: filteredUsers = users.filter((u) => { const q = search.trim().toLowerCase(); return !q || [u.display_name, u.full_name, u.company_name, u.role].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)); });

	async function load() {
		loading = true; error = '';
		try { const r = await fetch('/api/admin/users'); const b = await r.json(); if (r.status === 401) { goto('/connexion?redirect=/admin'); return; } if (r.status === 403) { goto('/'); return; } if (!r.ok) throw new Error(b.error || 'Chargement impossible.'); users = b.users ?? []; stats = b.stats ?? stats; }
		catch (e) { error = e instanceof Error ? e.message : 'Erreur de chargement.'; } finally { loading = false; }
	}
	async function updateUser(user: Profile, changes: { role?: Role; disabled?: boolean }) {
		savingId = user.id; error = '';
		try { const r = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, ...changes }) }); const b = await r.json(); if (!r.ok) throw new Error(b.error || 'Modification impossible.'); await load(); }
		catch (e) { error = e instanceof Error ? e.message : 'Modification impossible.'; } finally { savingId = ''; }
	}
	async function removeUser(user: Profile) {
		if (!confirm(`Supprimer définitivement le compte de ${user.display_name || user.full_name || 'cet utilisateur'} ? Cette action est irréversible.`)) return;
		savingId = user.id; error = '';
		try { const r = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id }) }); const b = await r.json(); if (!r.ok) throw new Error(b.error || 'Suppression impossible.'); await load(); }
		catch (e) { error = e instanceof Error ? e.message : 'Suppression impossible.'; } finally { savingId = ''; }
	}
	onMount(load);
</script>

<svelte:head><title>ChantierBot — Administration</title><meta name="description" content="Administration de ChantierBot." /></svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div class="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">👑 Administration</div><h1 class="text-3xl font-extrabold tracking-tight">Gestion de ChantierBot</h1><p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Utilisateurs, rôles et activité de la plateforme.</p></div><button class="btn-secondary" type="button" on:click={load} disabled={loading}>↻ Actualiser</button></div>
	{#if error}<div class="rounded-xl border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error">{error}</div>{/if}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><div class="card p-5"><p class="text-sm text-ink-secondary">Utilisateurs</p><p class="mt-2 text-3xl font-extrabold">{stats.users}</p></div><div class="card p-5"><p class="text-sm text-ink-secondary">Administrateurs</p><p class="mt-2 text-3xl font-extrabold">{stats.admins}</p></div><div class="card p-5"><p class="text-sm text-ink-secondary">Managers</p><p class="mt-2 text-3xl font-extrabold">{stats.managers}</p></div><div class="card p-5"><p class="text-sm text-ink-secondary">Clients</p><p class="mt-2 text-3xl font-extrabold">{stats.clients}</p></div><div class="card p-5"><p class="text-sm text-ink-secondary">Chantiers</p><p class="mt-2 text-3xl font-extrabold">{stats.chantiers}</p></div></div>
	<section class="card overflow-hidden"><div class="flex flex-col gap-4 border-b border-black/5 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="font-extrabold">Utilisateurs</h2><p class="mt-1 text-xs text-ink-secondary dark:text-ink-dark-secondary">Gère les rôles et l’accès à la plateforme.</p></div><input class="input w-full sm:w-72" bind:value={search} placeholder="Rechercher un utilisateur…" aria-label="Rechercher un utilisateur" /></div>
	{#if loading}<div class="p-8 text-center text-sm text-ink-secondary">Chargement des utilisateurs…</div>{:else if filteredUsers.length === 0}<div class="p-8 text-center text-sm text-ink-secondary">Aucun utilisateur trouvé.</div>{:else}<div class="divide-y divide-black/5 dark:divide-white/10">{#each filteredUsers as user}<div class="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between"><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><p class="truncate font-bold">{user.display_name || user.full_name || 'Utilisateur sans nom'}</p>{#if !user.disabled_at}<span class="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">Actif</span>{:else}<span class="rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error">Désactivé</span>{/if}</div><p class="truncate text-sm text-ink-secondary dark:text-ink-dark-secondary">{user.company_name || 'Entreprise non renseignée'}</p><p class="mt-1 text-xs text-ink-secondary/70">Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}</p></div><div class="flex flex-col gap-2 sm:flex-row sm:items-center"><select class="input w-full sm:w-40" value={user.role} disabled={savingId === user.id} on:change={(e) => updateUser(user, { role: (e.currentTarget as HTMLSelectElement).value as Role })} aria-label="Rôle utilisateur"><option value="user">👤 Utilisateur</option><option value="manager">🧑‍💼 Manager</option><option value="admin">👑 Admin</option></select><button class="btn-secondary" type="button" disabled={savingId === user.id} on:click={() => updateUser(user, { disabled: !user.disabled_at })}>{user.disabled_at ? '✓ Réactiver' : '⏸ Désactiver'}</button><button class="rounded-lg border border-error/20 px-3 py-2 text-sm font-bold text-error transition hover:bg-error/10" type="button" disabled={savingId === user.id} on:click={() => removeUser(user)}>🗑 Supprimer</button></div></div>{/each}</div>{/if}</section>
	<div class="rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm leading-relaxed text-ink"><strong>Important :</strong> les actions sensibles passent par le serveur avec la clé Service Role Supabase, qui ne doit jamais être exposée au navigateur.</div>
</div>
