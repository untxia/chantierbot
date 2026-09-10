<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browserSupabase } from '$lib/services/auth';
	import { toast } from '$lib/stores/toast';

	let mode: 'login' | 'signup' = 'login';
	let email = '';
	let password = '';
	let displayName = '';
	let companyName = '';
	let loading = false;

	$: redirectTo = $page.url.searchParams.get('redirect') || '/';

	async function submit() {
		if (!email.trim() || !password) return;
		loading = true;
		try {
			const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
			const payload = mode === 'login'
				? { email, password }
				: { email, password, displayName, companyName };
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const body = await response.json();
			if (!response.ok) throw new Error(body.error || 'Une erreur est survenue.');

			if (body.session) {
				await browserSupabase.auth.setSession({
					access_token: body.session.access_token,
					refresh_token: body.session.refresh_token
				});
				toast.success(mode === 'login' ? 'Connexion réussie.' : 'Compte créé. Bienvenue dans ChantierBot !');
				goto(redirectTo);
			} else {
				toast.info('Compte créé. Vérifie ton adresse email avant de te connecter.');
				mode = 'login';
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Une erreur est survenue.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>ChantierBot — Connexion</title>
	<meta name="description" content="Connexion et création de compte ChantierBot." />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-10 dark:bg-background-dark">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<img src="/logo/logo-horizontal-light.svg" alt="ChantierBot" class="mx-auto h-9 w-auto dark:hidden" />
			<img src="/logo/logo-horizontal-dark.svg" alt="ChantierBot" class="mx-auto hidden h-9 w-auto dark:block" />
			<p class="mt-4 text-sm text-ink-secondary dark:text-ink-dark-secondary">Ton copilote IA pour les chantiers.</p>
		</div>

		<section class="card p-6 sm:p-8">
			<div class="mb-6 grid grid-cols-2 rounded-xl bg-black/5 p-1 dark:bg-white/5">
				<button type="button" on:click={() => (mode = 'login')} class="rounded-lg px-3 py-2 text-sm font-bold {mode === 'login' ? 'bg-white shadow-sm dark:bg-surface-dark' : 'opacity-60'}">Connexion</button>
				<button type="button" on:click={() => (mode = 'signup')} class="rounded-lg px-3 py-2 text-sm font-bold {mode === 'signup' ? 'bg-white shadow-sm dark:bg-surface-dark' : 'opacity-60'}">Créer un compte</button>
			</div>

			<h1 class="text-2xl font-bold">{mode === 'login' ? 'Ravi de te revoir 👋' : 'Créer ton compte 🚀'}</h1>
			<p class="mt-1 text-sm text-ink-secondary dark:text-ink-dark-secondary">
				{mode === 'login' ? 'Retrouve tes chantiers et tes analyses.' : 'Quelques secondes pour commencer.'}
			</p>

			<form on:submit|preventDefault={submit} class="mt-6 space-y-4">
				{#if mode === 'signup'}
					<div>
						<label for="displayName" class="mb-1 block text-sm font-semibold">Nom / prénom</label>
						<input id="displayName" class="input" bind:value={displayName} placeholder="Ex. Christophe" autocomplete="name" />
					</div>
					<div>
						<label for="companyName" class="mb-1 block text-sm font-semibold">Entreprise</label>
						<input id="companyName" class="input" bind:value={companyName} placeholder="Ex. Dupont Bâtiment" autocomplete="organization" />
					</div>
				{/if}

				<div>
					<label for="email" class="mb-1 block text-sm font-semibold">Email</label>
					<input id="email" type="email" required class="input" bind:value={email} placeholder="toi@entreprise.fr" autocomplete="email" />
				</div>
				<div>
					<label for="password" class="mb-1 block text-sm font-semibold">Mot de passe</label>
					<input id="password" type="password" required minlength="8" class="input" bind:value={password} placeholder="8 caractères minimum" autocomplete={mode === 'login' ? 'current-password' : 'new-password'} />
				</div>

				<button class="btn-primary w-full" disabled={loading} type="submit">
					{loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
				</button>
			</form>
		</section>
	</div>
</div>
