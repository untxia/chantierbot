<script lang="ts">
	import '../lib/styles/globals.css';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { focusMode } from '$lib/stores/focus-mode';

	$: isDashboard = $page.url.pathname === '/';
</script>

<div class="flex min-h-screen bg-background dark:bg-background-dark">
	<Sidebar />

	<div class="min-w-0 flex-1">
		<header
			class="flex items-center justify-between gap-2 px-4 pt-4 sm:px-8 sm:pt-6 {isDashboard && !$focusMode
				? 'absolute inset-x-0 z-20'
				: ''}"
		>
			<a href="/" class="md:hidden" aria-label="Retour à l'accueil">
				<img src="/logo/logo-horizontal-light.svg" alt="ChantierBot" class="h-7 w-auto {isDashboard ? '' : 'dark:hidden'}" />
				{#if !isDashboard}
					<img src="/logo/logo-horizontal-dark.svg" alt="ChantierBot" class="hidden h-7 w-auto dark:block" />
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
<ToastHost />
