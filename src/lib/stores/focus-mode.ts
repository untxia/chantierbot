import { writable } from 'svelte/store';

function createFocusModeStore() {
	const initial = typeof localStorage !== 'undefined' && localStorage.getItem('chantierbot-focus') === '1';
	const { subscribe, set, update } = writable(initial);

	function persist(value: boolean) {
		if (typeof localStorage !== 'undefined') localStorage.setItem('chantierbot-focus', value ? '1' : '0');
		set(value);
	}

	return {
		subscribe,
		set: persist,
		toggle: () => update((v) => { persist(!v); return !v; })
	};
}

export const focusMode = createFocusModeStore();
