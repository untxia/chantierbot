export interface NavItem {
	href: string;
	label: string;
	icon: 'home' | 'folder' | 'users' | 'box' | 'calendar' | 'truck' | 'phone' | 'sparkles' | 'chart' | 'report' | 'settings' | 'more';
	soon?: boolean;
}

export const navItems: NavItem[] = [
	{ href: '/', label: 'Tableau de bord', icon: 'home' },
	{ href: '/projets', label: 'Chantiers', icon: 'folder' },
	{ href: '/clients', label: 'Clients', icon: 'users' },
	{ href: '/analyses', label: 'Stocks', icon: 'box' },
	{ href: '/planning', label: 'Planning', icon: 'calendar', soon: true },
	{ href: '/fournisseurs', label: 'Fournisseurs', icon: 'truck', soon: true },
	{ href: '/relances', label: 'Relances', icon: 'phone', soon: true },
	{ href: '/ia', label: 'Assistant IA', icon: 'sparkles' },
	{ href: '/rapports', label: 'Rapports', icon: 'report', soon: true },
	{ href: '/parametres', label: 'Paramètres', icon: 'settings' }
];

export const mobileNavItems: NavItem[] = [
	navItems.find((i) => i.href === '/')!,
	navItems.find((i) => i.href === '/projets')!,
	navItems.find((i) => i.href === '/ia')!,
	{ href: '/plus', label: 'Plus', icon: 'more' }
];
