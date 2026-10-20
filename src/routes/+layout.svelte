<script lang="ts">
	import '../lib/styles/globals.css';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { focusMode } from '$lib/stores/focus-mode';
	import IconDefs from '$lib/components/IconDefs.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { onMount } from 'svelte';
	import { appearance, applyAppearance } from '$lib/stores/appearance';
	import { initFloating } from '$lib/actions/floating';

	$: applyAppearance($appearance);
	onMount(() => initFloating());

	$: isDashboard = $page.url.pathname === '/';
	$: isAuth = $page.url.pathname === '/connexion';
	$: isLegal = ['/confidentialite', '/mentions-legales', '/conditions'].includes($page.url.pathname);
</script>

{#if isAuth}
	<main class="auth-shell">
		<slot />
	</main>
{:else if isLegal}
	<main class="ar-stage min-h-screen">
		<slot />
	</main>
{:else}
	<div class="ar-stage flex min-h-screen">
		<Sidebar />

		<div class="min-w-0 flex-1">
			<header
				class="flex items-center justify-between gap-2 px-4 pt-4 sm:px-8 sm:pt-6 {isDashboard && !$focusMode
					? 'absolute inset-x-0 z-20'
					: ''}"
			>
				<a href="/" class="md:hidden" aria-label="Retour à l'accueil">
					{#if isDashboard}
						<Logo tone="dark" size="sm" />
					{:else}
						<span class="dark:hidden"><Logo tone="light" size="sm" /></span>
						<span class="hidden dark:inline"><Logo tone="dark" size="sm" /></span>
					{/if}
				</a>
				<div class="ml-auto">
					<TopBar variant={isDashboard ? 'dark' : 'light'} />
				</div>
			</header>

			<main class={isDashboard ? 'pb-24 md:pb-0' : 'page-shell'}>
				<slot />
			</main>
		</div>
	</div>

	<BottomNav />
{/if}

<IconDefs />
<ToastHost />

<style>
	:global(html), :global(body), :global(#svelte) {
		margin: 0;
		min-height: 100%;
	}
	.auth-shell {
		min-height: 100vh;
		min-height: 100svh;
		width: 100%;
		margin: 0;
		overflow: hidden;
	}
</style>
