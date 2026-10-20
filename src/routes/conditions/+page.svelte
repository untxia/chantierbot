<script lang="ts">
	import LegalShell from '$lib/components/LegalShell.svelte';
	import LegalField from '$lib/components/LegalField.svelte';
	import { LEGAL } from '$lib/config/legal';
</script>

<svelte:head>
	<title>Conditions d’utilisation — {LEGAL.appName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<LegalShell title="Conditions d’utilisation">
	<h2>1. Objet</h2>
	<p>
		Ces conditions encadrent l’utilisation de {LEGAL.appName}, outil de gestion de chantier destiné aux artisans et aux professionnels du
		bâtiment (chantiers, photos analysées par IA, planning, fournisseurs, commandes, relances, stocks, mesures, devis).
	</p>

	<h2>2. Compte</h2>
	<p>
		L’accès nécessite un compte. Vous fournissez des informations exactes, gardez votre mot de passe confidentiel et êtes responsable
		des actions effectuées depuis votre compte.
	</p>

	<h2>3. Utilisation acceptable</h2>
	<ul>
		<li>Ne pas tenter d’accéder aux données d’autres utilisateurs ni de perturber le service.</li>
		<li>Ne pas importer de contenus illicites ni de photos portant atteinte à la vie privée de tiers.</li>
		<li>Respecter la réglementation applicable à votre activité.</li>
	</ul>

	<h2>4. Vos contenus et vos données</h2>
	<p>
		Vous restez propriétaire des contenus que vous saisissez ou importez. Vous garantissez avoir le droit de les utiliser, notamment pour
		les données personnelles de vos clients et fournisseurs, dont vous êtes responsable de traitement (voir la
		<a href="/confidentialite">politique de confidentialité</a>). Vous pouvez à tout moment exporter vos données ou supprimer votre
		compte depuis les Paramètres.
	</p>

	<h2>5. Résultats indicatifs</h2>
	<p>
		Les analyses de photos, estimations, mesures et brouillons de devis sont produits par des moyens automatiques et sont donnés à titre
		indicatif. Ils ne constituent ni un devis ferme, ni un relevé de géomètre, ni un avis professionnel. Vous devez les vérifier avant
		tout engagement. {LEGAL.appName} ne garantit pas leur exactitude.
	</p>

	<h2>6. Sécurité sur les chantiers</h2>
	<p>
		L’outil ne remplace pas vos obligations en matière d’hygiène et de sécurité. Les alertes ou rappels éventuels sont une aide, non une
		attestation de conformité.
	</p>

	<h2>7. Disponibilité</h2>
	<p>
		Le service est fourni « en l’état ». Nous nous efforçons d’en assurer la disponibilité mais ne garantissons pas l’absence
		d’interruption ou d’erreur.
	</p>

	<h2>8. Responsabilité</h2>
	<p>
		Dans la limite autorisée par la loi, {LEGAL.appName} n’est pas responsable des dommages indirects (perte de chiffre d’affaires,
		erreur de commande ou de devis fondée sur un résultat indicatif).
		<mark class="legal-todo">[à faire valider par un juriste : étendue et plafonds de responsabilité]</mark>
	</p>

	<h2>9. Résiliation</h2>
	<p>
		Vous pouvez supprimer votre compte à tout moment. Nous pouvons suspendre un compte en cas de non-respect de ces conditions.
	</p>

	<h2>10. Évolution des conditions</h2>
	<p>
		Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de la page. Contact :
		<LegalField value={LEGAL.contactEmail} label="e-mail de contact" />.
	</p>

	<h2>11. Droit applicable</h2>
	<p>Droit français. <mark class="legal-todo">[à préciser : juridiction compétente]</mark></p>
</LegalShell>
