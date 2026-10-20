/**
 * Informations légales de l'éditeur.
 *
 * À COMPLÉTER avant d'ouvrir le service au public : tant qu'un champ est vide, les pages
 * légales affichent un repère « à compléter » et un bandeau d'avertissement.
 * Ne rien inventer : ces informations doivent être exactes.
 */
export const LEGAL = {
	appName: 'ChantierBot',
	siteUrl: 'https://chantierbot.vercel.app',
	/** Nom et prénom (entrepreneur individuel) ou raison sociale. */
	editorName: '',
	/** Ex. : entreprise individuelle, micro-entreprise, SAS, SARL… */
	legalForm: '',
	/** Numéro SIRET, si l'éditeur en a un. */
	siret: '',
	/** Adresse postale de l'éditeur (ou de domiciliation). */
	address: '',
	/** Adresse e-mail de contact, publique. */
	contactEmail: '',
	/** Directeur de la publication (en général l'éditeur). */
	publicationDirector: '',
	lastUpdated: '20 octobre 2026'
};

const REQUIRED: [keyof typeof LEGAL, string][] = [
	['editorName', 'nom ou raison sociale'],
	['legalForm', 'forme juridique'],
	['address', 'adresse'],
	['contactEmail', 'e-mail de contact'],
	['publicationDirector', 'directeur de la publication']
];

/** Libellés des champs obligatoires encore vides. */
export function missingLegalFields(): string[] {
	return REQUIRED.filter(([key]) => !String(LEGAL[key]).trim()).map(([, label]) => label);
}
