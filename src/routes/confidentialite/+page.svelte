<script lang="ts">
	import LegalShell from '$lib/components/LegalShell.svelte';
	import LegalField from '$lib/components/LegalField.svelte';
	import { LEGAL } from '$lib/config/legal';
</script>

<svelte:head>
	<title>Politique de confidentialité — {LEGAL.appName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<LegalShell title="Politique de confidentialité">
	<p>
		Cette politique explique quelles données {LEGAL.appName} traite, pourquoi, avec qui elles sont partagées, combien de temps
		elles sont conservées et comment exercer vos droits.
	</p>

	<h2>1. Qui est responsable de vos données ?</h2>
	<p>
		<strong>Données de votre compte et usage du service</strong> : l’éditeur, <LegalField value={LEGAL.editorName} label="nom ou raison sociale" />,
		est responsable de traitement. Contact : <LegalField value={LEGAL.contactEmail} label="e-mail de contact" />.
	</p>
	<p>
		<strong>Données de vos clients, fournisseurs et chantiers</strong> que vous saisissez dans l’application : c’est <strong>vous</strong>,
		artisan, qui êtes responsable de traitement ; {LEGAL.appName} agit pour votre compte en tant que sous-traitant. Vous devez donc
		informer vos propres clients de l’utilisation de ces données. Un accord de sous-traitance est disponible sur demande.
	</p>

	<h2>2. Quelles données traitons-nous ?</h2>
	<ul>
		<li><strong>Compte</strong> : adresse e-mail, mot de passe (stocké sous forme chiffrée, jamais en clair), nom, entreprise, téléphone, métier.</li>
		<li><strong>Contenu que vous saisissez</strong> : chantiers, clients (nom, e-mail, téléphone, adresse), fournisseurs, commandes, relances, rendez-vous, stocks, mesures, notes.</li>
		<li><strong>Photos de chantier</strong> et résultats de leur analyse par l’IA.</li>
		<li><strong>Données techniques</strong> : informations de session nécessaires à la connexion et journaux techniques de sécurité.</li>
	</ul>

	<h2>3. Pourquoi, et sur quelle base légale ?</h2>
	<table>
		<thead><tr><th>Finalité</th><th>Base légale</th></tr></thead>
		<tbody>
			<tr><td>Créer votre compte et fournir le service (chantiers, planning, commandes, mesures, devis, analyses)</td><td>Exécution du contrat</td></tr>
			<tr><td>Sécuriser le service et prévenir les abus</td><td>Intérêt légitime</td></tr>
			<tr><td>Respecter nos obligations légales</td><td>Obligation légale</td></tr>
		</tbody>
	</table>
	<p>Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.</p>

	<h2>4. Qui reçoit vos données ?</h2>
	<p>Nous faisons appel aux prestataires techniques suivants (sous-traitants) :</p>
	<table>
		<thead><tr><th>Prestataire</th><th>Rôle</th><th>Localisation</th></tr></thead>
		<tbody>
			<tr><td>Supabase</td><td>Base de données, authentification, stockage des photos</td><td>Europe (Allemagne)</td></tr>
			<tr><td>Vercel</td><td>Hébergement de l’application</td><td>Infrastructure mondiale ; des traitements hors Union européenne sont possibles</td></tr>
			<tr><td>Groq</td><td>Analyse par intelligence artificielle des photos et textes que vous soumettez</td><td>États-Unis</td></tr>
		</tbody>
	</table>
	<p>
		Les transferts hors Union européenne doivent être encadrés par les garanties prévues par le RGPD (décision d’adéquation ou clauses
		contractuelles types).
		<mark class="legal-todo">[à vérifier avant publication : garanties applicables à chaque prestataire]</mark>
	</p>

	<h2>5. Analyse par intelligence artificielle</h2>
	<p>
		Quand vous demandez l’analyse d’une photo ou une estimation, l’image et le texte de contexte (par exemple votre métier) sont
		transmis au prestataire d’IA pour produire une description, une liste de matériaux et une estimation. Les résultats sont enregistrés
		dans votre compte. Ils sont <strong>indicatifs</strong> et peuvent comporter des erreurs.
		<mark class="legal-todo">[à vérifier avant publication : conditions du prestataire sur la conservation et la réutilisation des données transmises]</mark>
	</p>

	<h2>6. Photos montrant des personnes</h2>
	<p>
		Évitez de photographier des personnes identifiables (visages, plaques d’immatriculation) sans leur accord, et informez les occupants
		d’un logement avant de prendre des photos. Vous êtes responsable de l’usage des photos que vous importez.
	</p>

	<h2>7. Combien de temps conservons-nous vos données ?</h2>
	<ul>
		<li>Tant que votre compte est actif.</li>
		<li>
			À la suppression de votre compte (Paramètres → « Supprimer mon compte »), vos données et vos photos sont effacées. Les
			sauvegardes techniques sont purgées dans un délai de <mark class="legal-todo">[à préciser]</mark>.
		</li>
		<li>Compte inactif : <mark class="legal-todo">[durée à définir]</mark>.</li>
	</ul>

	<h2>8. Vos droits</h2>
	<p>
		Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données.
	</p>
	<ul>
		<li><strong>Récupérer vos données</strong> : Paramètres → « Exporter mes données » (fichier JSON).</li>
		<li><strong>Supprimer votre compte et vos données</strong> : Paramètres → « Supprimer mon compte ».</li>
		<li>
			<strong>Toute autre demande</strong> : écrivez à <LegalField value={LEGAL.contactEmail} label="e-mail de contact" />. Nous répondons dans un délai d’un mois.
		</li>
	</ul>
	<p>
		Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL
		(<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).
	</p>

	<h2>9. Sécurité</h2>
	<ul>
		<li>Connexion chiffrée (HTTPS).</li>
		<li>Chaque compte n’accède qu’à ses propres données : le cloisonnement est appliqué au niveau de la base de données.</li>
		<li>Les photos sont stockées dans un espace privé et consultées par des liens temporaires.</li>
		<li>Les mots de passe sont gérés par un service d’authentification dédié et ne sont jamais stockés en clair.</li>
	</ul>

	<h2>10. Cookies et stockage local</h2>
	<p>
		{LEGAL.appName} n’utilise que des éléments <strong>strictement nécessaires</strong> : cookies de session (connexion) et stockage local
		du navigateur pour vos préférences (thème, fond d’écran, réglages d’affichage, brouillon de devis). Aucun traceur publicitaire ni
		outil de mesure d’audience tiers n’est utilisé à ce jour, c’est pourquoi aucun bandeau de consentement n’est affiché.
	</p>

	<h2>11. Modifications</h2>
	<p>Nous pouvons faire évoluer cette politique ; la date de mise à jour figure en haut de la page.</p>
</LegalShell>
