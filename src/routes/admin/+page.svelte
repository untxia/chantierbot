<script lang="ts">
	import { onMount } from 'svelte';
	import { browserSupabase } from '$lib/services/auth';
	import { goto } from '$app/navigation';

	type Profile = {
		id: string;
		display_name: string | null;
		full_name: string | null;
		company_name: string | null;
		role: 'admin' | 'manager' | 'user';
		created_at: string;
	};

	let users: Profile[] = [];
	let loading = true;
	let savingId = '';
	let error = '';
	let currentUserId = '';

	async function load() {
		loading = true;
		error = '';
		const { data: sessionData } = await browserSupabase.auth.getSession();
		currentUserId = sessionData.session?.user.id ?? '';
		if (!currentUserId) {
			goto('/connexion?redirect=/admin');
			return;
		}

		const { data: me, error: meError } = await browserSupabase
			.from('profiles')
			.select('role')
			.eq('id', currentUserId)
			.single();
		if (meError || me?.role !== 'admin') {
			goto('/');
			return;
		}

		const { data, error: usersError } = await browserSupabase
			.from('profiles')
			.select('id, display_name, full_name, company_name, role, created_at')
			.order('created_at', { ascending: false });
		if (usersError) error = usersError.message;
		users = (data ?? []) as Profile[];
		loading = false;
	}

	async function changeRole(user: Profile, role: Profile['role']) {
		if (user.id === currentUserId) return;
		savingId = user.id;
		error = '';
		const { error: updateError } = await browserSupabase.from('profiles').update({ role }).eq('id', user.id);
		if (updateError) error = updateError.message;
		else user.role = role;
		savingId = '';
	}

	onMount(load);
</script>

<svelte:head>
	<title>ChantierBot — Administration</title>
	<meta name="description" content="Administration de ChantierBot." />
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
		<div>
			<div class="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
				👑 Administration
			</div>
			<h1 class="text-3xl font-extrabold tracking-tight">Gestion de ChantierBot</h1>
			<p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">Utilisateurs, rôles et activité de la plateforme.</p>
		</div>
		<button class="btn-secondary" type="button" on:click={load}>↻ Actualiser</button>
	</div>

	{#if error}
		<div class="rounded-xl border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error">{error}</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="card p-5"><p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Utilisateurs</p><p class="mt-2 text-3xl font-extrabold">{users.length}</p></div>
		<div class="card p-5"><p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Administrateurs</p><p class="mt-2 text-3xl font-extrabold">{users.filter((u) => u.role === 'admin').length}</p></div>
		<div class="card p-5"><p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">Managers</p><p class="mt-2 text-3xl font-extrabold">{users.filter((u) => u.role === 'manager').length}</p></div>
	</div>

	<section class="card overflow-hidden">
		<div class="border-b border-black/5 p-5 dark:border-white/10">
			<h2 class="font-extrabold">Utilisateurs</h2>
			<p class="mt-1 text-xs text-ink-secondary dark:text-ink-dark-secondary">Le compte administrateur actuel ne peut pas modifier son propre rôle depuis cette interface.</p>
		</div>

		{#if loading}
			<div class="p-8 text-center text-sm text-ink-secondary">Chargement des utilisateurs…</div>
		{:else if users.length === 0}
			<div class="p-8 text-center text-sm text-ink-secondary">Aucun utilisateur.</div>
		{:else}
			<div class="divide-y divide-black/5 dark:divide-white/10">
				{#each users as user}
					<div class="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<p class="truncate font-bold">{user.display_name || user.full_name || 'Utilisateur sans nom'}</p>
								{#if user.id === currentUserId}<span class="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary">Vous</span>{/if}
							</div>
							<p class="truncate text-sm text-ink-secondary dark:text-ink-dark-secondary">{user.company_name || 'Entreprise non renseignée'}</p>
							<p class="mt-1 text-xs text-ink-secondary/70">Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
						</div>
						<select
							class="input w-full md:w-40"
							value={user.role}
						disabled={user.id === currentUserId || savingId === user.id}
						on:change={(event) => changeRole(user, (event.currentTarget as HTMLSelectElement).value as Profile['role'])}
						aria-label="Rôle utilisateur"
						>
							<option value="user">👤 Utilisateur</option>
							<option value="manager">🧑‍💼 Manager</option>
							<option value="admin">👑 Admin</option>
						</select>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<div class="rounded-xl border border-warning/20 bg-warning/10 p-4 text-sm leading-relaxed text-ink">
		<strong>À noter :</strong> la gestion complète des comptes Auth (suppression définitive, désactivation, réinitialisation de mot de passe) devra passer par une route serveur sécurisée avec la clé service Supabase. Elle n'est volontairement pas exposée au navigateur.
	</div>
</div>
