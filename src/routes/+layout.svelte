<script lang="ts">
	import '../lib/styles/globals.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
</script>

<div class="flex min-h-screen">
	<Sidebar />

	<div class="flex-1">
		<header class="flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6 md:hidden">
			<a href="/">
				<img src="/logo/logo-horizontal-light.svg" alt="ChantierBot" class="h-7 w-auto dark:hidden" />
				<img src="/logo/logo-horizontal-dark.svg" alt="ChantierBot" class="hidden h-7 w-auto dark:block" />
			</a>
		</header>

		<main class="mx-auto max-w-6xl p-4 pb-24 sm:p-8 md:pb-8">
			<slot />
		</main>
	</div>
</div>

<BottomNav />
<ToastHost />
