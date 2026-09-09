export interface NavItem {
	href: string;
	label: string;
	icon: 'home' | 'folder' | 'sparkles' | 'chart' | 'settings' | 'more';
}

export const navItems: NavItem[] = [
	{ href: '/', label: 'Accueil', icon: 'home' },
	{ href: '/projets', label: 'Projets', icon: 'folder' },
	{ href: '/ia', label: 'IA', icon: 'sparkles' },
	{ href: '/analyses', label: 'Analyses', icon: 'chart' },
	{ href: '/parametres', label: 'Paramètres', icon: 'settings' }
];

export const mobileNavItems: NavItem[] = [
	navItems[0],
	navItems[1],
	navItems[2],
	{ href: '/plus', label: 'Plus', icon: 'more' }
];
