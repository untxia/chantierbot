<script lang="ts">
	import type { NavItem } from './nav-items';

	export let icon: NavItem['icon'];
</script>

{#if icon === 'home'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M3 11.5 12 4l9 7.5" />
		<path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
	</svg>
{:else if icon === 'folder'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M3.5 6a1 1 0 0 1 1-1h4.5l2 2.5h9a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1h-15.5a1 1 0 0 1-1-1V6Z" />
	</svg>
{:else if icon === 'box'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" />
		<path d="M3.5 8v8l8.5 4 8.5-4V8" />
		<path d="M12 12v8" />
	</svg>
{:else if icon === 'calendar'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<rect x="3.5" y="5" width="17" height="16" rx="2" />
		<path d="M3.5 10h17M8 3v4M16 3v4" />
	</svg>
{:else if icon === 'truck'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M2.5 6h11v10h-11z" />
		<path d="M13.5 10h4l3 3v3h-7z" />
		<circle cx="7" cy="18" r="1.6" />
		<circle cx="17" cy="18" r="1.6" />
	</svg>
{:else if icon === 'phone'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M5 4h3.5l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2C10.5 21 3 13.5 3 6a2 2 0 0 1 2-2Z" />
	</svg>
{:else if icon === 'report'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M6 3h9l3 3v15H6z" />
		<path d="M15 3v3h3M9 12h6M9 16h6" />
	</svg>
{:else if icon === 'sparkles'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
	</svg>
{:else if icon === 'chart'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<path d="M4 20V10M12 20V4M20 20v-7" />
	</svg>
{:else if icon === 'settings'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<circle cx="12" cy="12" r="3" />
		<path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z" />
	</svg>
{:else if icon === 'more'}
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
		<circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
		<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
		<circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" />
	</svg>
{/if}
