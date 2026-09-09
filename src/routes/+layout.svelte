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

<div class="flex min-h-screen">
	<Sidebar />

	<div class="flex-1">
		<header
			class="flex items-center justify-between gap-2 px-4 pt-4 sm:px-8 sm:pt-6 {isDashboard && !$focusMode
				? 'absolute inset-x-0 z-10'
				: ''}"
		>
			<a href="/" class="md:hidden">
				<img src="/logo/logo-horizontal-light.svg" alt="ChantierBot" class="h-7 w-auto {isDashboard ? '' : 'dark:hidden'}" />
				{#if !isDashboard}
					<img src="/logo/logo-horizontal-dark.svg" alt="ChantierBot" class="hidden h-7 w-auto dark:block" />
				{/if}
			</a>
			<div class="ml-auto">
				<TopBar variant={isDashboard ? 'dark' : 'light'} />
			</div>
		</header>

		<main class={isDashboard ? 'pb-24 md:pb-0' : 'mx-auto max-w-6xl p-4 pb-24 sm:p-8 md:pb-8'}>
			<slot />
		</main>
	</div>
</div>

<BottomNav />
<ToastHost />
