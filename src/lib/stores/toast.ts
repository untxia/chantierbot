import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
	id: string;
	kind: ToastKind;
	message: string;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function dismiss(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	function push(kind: ToastKind, message: string, timeoutMs = 5000) {
		const id = crypto.randomUUID();
		update((toasts) => [...toasts, { id, kind, message }]);
		if (timeoutMs > 0) setTimeout(() => dismiss(id), timeoutMs);
		return id;
	}

	return {
		subscribe,
		dismiss,
		success: (message: string) => push('success', message),
		info: (message: string) => push('info', message),
		warning: (message: string) => push('warning', message),
		error: (message: string) => push('error', message)
	};
}

export const toast = createToastStore();
