<script lang="ts">
	import type { NavItem } from './nav-items';
	export let icon: NavItem['icon'];
</script>

<!-- Icônes « 3D » : dégradés + reflet + ombre portée (voir IconDefs.svelte et .icon-3d). -->
<svg viewBox="0 0 24 24" class="icon-3d h-6 w-6 shrink-0" aria-hidden="true">
	{#if icon === 'home'}
		<rect x="5" y="10.5" width="14" height="10" rx="2" fill="url(#g-white)" />
		<path d="M2.2 11.8 12 3l9.8 8.8c.4.4.1 1.2-.5 1.2H2.7c-.6 0-.9-.8-.5-1.2Z" fill="url(#g-red)" />
		<path d="M5 10.6 12 4.4" stroke="#fff" stroke-opacity=".55" stroke-width="1" stroke-linecap="round" />
		<rect x="10" y="14.5" width="4" height="6" rx="1" fill="url(#g-blue)" />
	{:else if icon === 'folder'}
		<path d="M3 6.5a2 2 0 0 1 2-2h4.2l2 2.3H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" fill="url(#g-amber-dark)" />
		<path d="M3 10.2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7.8Z" fill="url(#g-amber)" />
		<path d="M4.5 9.6h15" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-linecap="round" />
	{:else if icon === 'users'}
		<circle cx="16.2" cy="8" r="3" fill="url(#g-violet)" />
		<path d="M11.4 20v-1.4a4.6 4.6 0 0 1 4.6-4.6h.5a4.6 4.6 0 0 1 4.6 4.6V20Z" fill="url(#g-violet)" />
		<circle cx="9" cy="9" r="3.5" fill="url(#g-blue)" />
		<path d="M2.4 20.6v-1.8A4.8 4.8 0 0 1 7.2 14h3.6a4.8 4.8 0 0 1 4.8 4.8v1.8Z" fill="url(#g-blue)" />
		<ellipse cx="7.9" cy="7.7" rx="1.3" ry=".8" fill="#fff" fill-opacity=".5" />
	{:else if icon === 'box'}
		<path d="M12 2.8 20.6 7.4 12 12 3.4 7.4Z" fill="#FFDC85" />
		<path d="M3.4 7.4 12 12v9.2L3.4 16.6Z" fill="#FFB020" />
		<path d="M20.6 7.4 12 12v9.2l8.6-4.6Z" fill="#DE8500" />
		<path d="M12 12v9.2" stroke="#fff" stroke-opacity=".35" stroke-width=".8" />
	{:else if icon === 'calendar'}
		<rect x="3" y="5" width="18" height="16" rx="3" fill="url(#g-white)" />
		<path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2H3V8Z" fill="url(#g-red)" />
		<rect x="7" y="2.6" width="2.2" height="4.4" rx="1.1" fill="url(#g-slate)" />
		<rect x="14.8" y="2.6" width="2.2" height="4.4" rx="1.1" fill="url(#g-slate)" />
		<circle cx="8" cy="14" r="1.2" fill="url(#g-blue)" /><circle cx="12" cy="14" r="1.2" fill="url(#g-blue)" /><circle cx="16" cy="14" r="1.2" fill="url(#g-blue)" />
		<circle cx="8" cy="17.5" r="1.2" fill="url(#g-blue)" /><circle cx="12" cy="17.5" r="1.2" fill="url(#g-amber)" />
	{:else if icon === 'truck'}
		<rect x="1.8" y="6" width="12" height="10.5" rx="1.8" fill="url(#g-blue)" />
		<path d="M13.8 9.5h4.2l3.4 3.6v3.4h-7.6Z" fill="url(#g-violet)" />
		<path d="M15.4 10.9h2.2l1.9 2h-4.1Z" fill="#fff" fill-opacity=".7" />
		<circle cx="7" cy="17.6" r="2.4" fill="#2A3350" /><circle cx="7" cy="17.6" r="1" fill="url(#g-slate)" />
		<circle cx="17" cy="17.6" r="2.4" fill="#2A3350" /><circle cx="17" cy="17.6" r="1" fill="url(#g-slate)" />
	{:else if icon === 'phone'}
		<path d="M5.4 3.5h3.2c.5 0 .9.3 1 .8l.8 3c.1.4 0 .8-.3 1.1L8.6 9.7a12 12 0 0 0 5.7 5.7l1.3-1.5c.3-.3.7-.4 1.1-.3l3 .8c.5.1.8.5.8 1v3.2a2 2 0 0 1-2.1 2C10.7 20.200 3.700 13.200 3.400 5.600a2 2 0 0 1 2-2.100Z" fill="url(#g-green)" />
		<path d="M6 4.4h2.4" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-linecap="round" />
	{:else if icon === 'sparkles'}
		<path d="M10 2.6 12.1 8l5.400 2.100L12.100 12.200 10 17.600 7.900 12.200 2.500 10.100 7.900 8Z" fill="url(#g-amber)" />
		<path d="M18.200 12.800l1.100 2.700 2.700 1.100-2.700 1.100-1.100 2.700-1.100-2.700-2.700-1.100 2.700-1.100Z" fill="url(#g-violet)" />
		<path d="M10 5.600l.9 2.300" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-linecap="round" />
	{:else if icon === 'chart'}
		<rect x="3.5" y="12" width="4.6" height="8.5" rx="1.4" fill="url(#g-blue)" />
		<rect x="9.7" y="5" width="4.6" height="15.5" rx="1.4" fill="url(#g-violet)" />
		<rect x="15.9" y="9" width="4.6" height="11.5" rx="1.4" fill="url(#g-green)" />
	{:else if icon === 'report'}
		<path d="M6 2.8h8.200L19 7.600V19a2.200 2.200 0 0 1-2.200 2.200H6A2.200 2.200 0 0 1 3.800 19V5A2.200 2.200 0 0 1 6 2.800Z" transform="translate(.6 0)" fill="url(#g-white)" />
		<path d="M14.800 2.800v3.600a1.200 1.200 0 0 0 1.200 1.200h3.600Z" fill="url(#g-slate)" />
		<rect x="7.800" y="11" width="8.400" height="1.800" rx=".9" fill="url(#g-blue)" />
		<rect x="7.800" y="14.500" width="8.400" height="1.800" rx=".9" fill="url(#g-blue)" />
		<rect x="7.800" y="18" width="5" height="1.800" rx=".9" fill="url(#g-amber)" />
	{:else if icon === 'settings'}
		<path d="M10.300 2.600h3.400l.5 2.300 1.700.7 2-1.300 2.400 2.400-1.300 2 .7 1.700 2.300.5v3.400l-2.300.5-.7 1.700 1.300 2-2.400 2.400-2-1.300-1.700.7-.5 2.300h-3.400l-.5-2.300-1.700-.7-2 1.300-2.400-2.400 1.300-2-.7-1.700-2.300-.5v-3.400l2.300-.5.7-1.700-1.300-2 2.400-2.400 2 1.300 1.700-.7Z" fill="url(#g-slate)" />
		<circle cx="12" cy="12" r="3.300" fill="url(#g-white)" /><circle cx="12" cy="12" r="1.500" fill="url(#g-blue)" />
	{:else if icon === 'ruler'}
		<g transform="rotate(-40 12 12)">
			<rect x="1.200" y="8.200" width="21.600" height="7.600" rx="2" fill="url(#g-amber)" />
			<path d="M4.500 8.200v3.200M7.500 8.200v2.200M10.500 8.200v3.200M13.500 8.200v2.200M16.500 8.200v3.200M19.500 8.200v2.200" stroke="#7A4A00" stroke-width="1" stroke-linecap="round" />
			<path d="M2.500 9.400h19" stroke="#fff" stroke-opacity=".55" stroke-width=".8" stroke-linecap="round" />
		</g>
	{:else if icon === 'more'}
		<circle cx="5" cy="12" r="2.200" fill="url(#g-slate)" />
		<circle cx="12" cy="12" r="2.200" fill="url(#g-slate)" />
		<circle cx="19" cy="12" r="2.200" fill="url(#g-slate)" />
	{/if}
</svg>
