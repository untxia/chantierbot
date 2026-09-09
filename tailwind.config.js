/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',
	theme: {
		extend: {
			colors: {
				primary: '#5865F2',
				secondary: '#8B5CF6',
				'dark-navy': '#0B1020',
				success: '#22C55E',
				warning: '#F59E0B',
				danger: '#EF4444',
				surface: {
					DEFAULT: '#FFFFFF',
					dark: '#111827',
					'dark-secondary': '#182033'
				},
				background: {
					DEFAULT: '#F7F8FC',
					dark: '#080C18'
				},
				ink: {
					DEFAULT: '#111827',
					secondary: '#64748B',
					dark: '#F8FAFC',
					'dark-secondary': '#94A3B8'
				},
				border: {
					dark: '#263247'
				}
			},
			fontFamily: {
				sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
			},
			borderRadius: {
				sm: '8px',
				md: '10px',
				lg: '14px',
				xl: '18px',
				'2xl': '24px'
			},
			backgroundImage: {
				'brand-gradient': 'linear-gradient(135deg, #5865F2 0%, #8B5CF6 100%)'
			},
			boxShadow: {
				card: '0 8px 30px rgba(15, 23, 42, 0.05)'
			},
			transitionDuration: {
				fast: '150ms',
				normal: '250ms'
			}
		}
	},
	plugins: []
};
