<script lang="ts">
	import LegalShell from '$lib/components/LegalShell.svelte';
	import LegalField from '$lib/components/LegalField.svelte';
	import { LEGAL } from '$lib/config/legal';
</script>

<svelte:head>
	<title>Mentions légales — {LEGAL.appName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<LegalShell title="Mentions légales">
	<h2>Éditeur du site</h2>
	<ul>
		<li>Nom ou raison sociale : <LegalField value={LEGAL.editorName} label="nom ou raison sociale" /></li>
		<li>Forme juridique : <LegalField value={LEGAL.legalForm} label="forme juridique" /></li>
		<li>SIRET : {#if LEGAL.siret.trim()}{LEGAL.siret}{:else}<span>non renseigné</span>{/if}</li>
		<li>Adresse : <LegalField value={LEGAL.address} label="adresse" /></li>
		<li>Contact : <LegalField value={LEGAL.contactEmail} label="e-mail de contact" /></li>
		<li>Site : <a href={LEGAL.siteUrl}>{LEGAL.siteUrl}</a></li>
	</ul>

	<h2>Directeur de la publication</h2>
	<p><LegalField value={LEGAL.publicationDirector} label="directeur de la publication" /></p>

	<h2>Hébergement</h2>
	<ul>
		<li>
			<strong>Application</strong> : Vercel Inc. — <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a>
			<mark class="legal-todo">[adresse à compléter depuis vercel.com/legal]</mark>
		</li>
		<li>
			<strong>Base de données et fichiers</strong> : Supabase — <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>,
			région Europe (Allemagne) <mark class="legal-todo">[adresse à compléter depuis supabase.com]</mark>
		</li>
	</ul>

	<h2>Nature du service et limites</h2>
	<p>
		{LEGAL.appName} est un outil d’aide à la gestion de chantier. Les analyses de photos, estimations, mesures (en réalité augmentée ou
		sur photo) et brouillons de devis sont générés automatiquement ou à partir de relevés approximatifs : ils sont
		<strong>indicatifs</strong>, peuvent contenir des erreurs et doivent être vérifiés par l’utilisateur avant tout engagement
		(devis, commande de matériaux, travaux).
	</p>
	<p>
		Les informations relatives à la sécurité sur les chantiers ne remplacent ni la réglementation en vigueur, ni l’avis d’un
		professionnel de la prévention ou d’un coordonnateur de sécurité.
	</p>

	<h2>Propriété intellectuelle</h2>
	<p>
		Le logiciel, le logo, la mascotte et les contenus de {LEGAL.appName} sont protégés. Toute reproduction sans autorisation est interdite.
		Les contenus que vous importez restent votre propriété.
	</p>

	<h2>Données personnelles</h2>
	<p>
		Le traitement de vos données est décrit dans la <a href="/confidentialite">politique de confidentialité</a>. Vous pouvez exercer vos
		droits depuis les Paramètres ou en écrivant à <LegalField value={LEGAL.contactEmail} label="e-mail de contact" />.
	</p>

	<h2>Droit applicable</h2>
	<p>Le site est soumis au droit français.</p>
</LegalShell>
