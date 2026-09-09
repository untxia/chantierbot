import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

function getInitial(): Theme {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function createThemeStore() {
	const { subscribe, set } = writable<Theme>(getInitial());

	function apply(theme: Theme) {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.toggle('dark', theme === 'dark');
			localStorage.setItem('chantierbot-theme', theme);
		}
		set(theme);
	}

	return {
		subscribe,
		set: apply,
		toggle() {
			apply(getInitial() === 'dark' ? 'light' : 'dark');
		}
	};
}

export const theme = createThemeStore();
