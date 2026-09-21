<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browserSupabase } from '$lib/services/auth';
	import { toast } from '$lib/stores/toast';

	let mode: 'login' | 'signup' = 'login';
	let email = '';
	let password = '';
	let displayName = '';
	let companyName = '';
	let loading = false;
	let passwordVisible = false;
	let confirmPassword = '';
	let acceptTerms = false;

	$: redirectTo = $page.url.searchParams.get('redirect') || '/';

	function switchMode(nextMode: 'login' | 'signup') {
		mode = nextMode;
		passwordVisible = false;
	}

	function handlePasswordInput(event: Event) {
		password = (event.currentTarget as HTMLInputElement).value;
	}

	function handleConfirmPasswordInput(event: Event) {
		confirmPassword = (event.currentTarget as HTMLInputElement).value;
	}

	async function submit() {
		if (!email.trim() || !password) return;
		if (mode === 'signup') {
			if (password !== confirmPassword) {
				toast.error('Les mots de passe ne correspondent pas.');
				return;
			}
			if (!acceptTerms) {
				toast.error('Merci d’accepter les conditions d’utilisation.');
				return;
			}
		}
		loading = true;
		try {
			const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
			const payload = mode === 'login'
				? { email, password }
				: { email, password, displayName, companyName };
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const body = await response.json();
			if (!response.ok) throw new Error(body.error || 'Une erreur est survenue.');

			if (body.session) {
				await browserSupabase.auth.setSession({
					access_token: body.session.access_token,
					refresh_token: body.session.refresh_token
				});
				toast.success(mode === 'login' ? 'Connexion réussie.' : 'Compte créé. Bienvenue dans ChantierBot !');
				goto(redirectTo);
			} else {
				toast.info('Compte créé. Vérifie ton adresse email avant de te connecter.');
				mode = 'login';
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Une erreur est survenue.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>ChantierBot — Connexion</title>
	<meta name="description" content="Connexion et création de compte ChantierBot." />
</svelte:head>

<div class="auth-page">
	<div class="ambient ambient-one"></div>
	<div class="ambient ambient-two"></div>
	<div class="blueprint-grid"></div>

	<div class="floating-window">
		<div class="visual-panel">
			<div class="visual-glow"></div>
			<div class="brand-row">
				<div class="brand-stack">
					<img src="/logo/chantierbot-3d.svg" alt="ChantierBot" class="brand-logo" />
				</div>
			</div>

			<div class="visual-copy">
				<h2>« Moins d'administratif,<br /><strong>plus de chantiers ! »</strong></h2>
				<p>L'IA au service des artisans pour organiser, analyser et anticiper chaque étape.</p>
			</div>

			<div class="feature-list">
				<div><span>✓</span> Gère tes chantiers</div>
				<div><span>✓</span> Planifie tes journées</div>
				<div><span>✓</span> Optimise tes stocks</div>
				<div><span>✓</span> Génére tes devis avec l'IA</div>
				<div><span>✓</span> Gagne du temps</div>
			</div>
			<div class="handwritten">L'IA au service<br />des artisans !</div>
		</div>

		<div class="form-panel">
			<button type="button" class="close-button" aria-label="Fermer" on:click={() => goto('/')}>×</button>
			<div class="form-top">
				<div class="mobile-logo">
					<img src="/logo/logo-horizontal-dark.svg" alt="ChantierBot" />
				</div>
				<div class="secure-badge"><span></span> Espace sécurisé</div>
			</div>

			<div class="mode-switch">
				<button type="button" on:click={() => switchMode('login')} class:active={mode === 'login'}>
					Connexion
				</button>
				<button type="button" on:click={() => switchMode('signup')} class:active={mode === 'signup'}>
					Inscription
				</button>
			</div>

			<div class="form-heading">
				<span class="small-kicker">{mode === 'login' ? 'BON RETOUR 👋' : 'BIENVENUE 🚀'}</span>
				<h1>{mode === 'login' ? 'Bon retour !' : 'Rejoignez ChantierBot !'}</h1>
				<p>{mode === 'login' ? 'Connectez-vous pour retrouver vos chantiers.' : 'Créez votre compte et simplifiez la gestion de vos chantiers.'}</p>
			</div>

			<form on:submit|preventDefault={submit}>
				{#if mode === 'signup'}
					<div class="field">
						<label for="displayName">Nom / prénom</label>
						<div class="input-wrap">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>
							<input id="displayName" bind:value={displayName} placeholder="Ex. Christophe" autocomplete="name" />
						</div>
					</div>
					<div class="field">
						<label for="companyName">Entreprise</label>
						<div class="input-wrap">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V5h10v16M15 9h4v12M8 9h4M8 13h4M8 17h4"/></svg>
							<input id="companyName" bind:value={companyName} placeholder="Ex. Dupont Bâtiment" autocomplete="organization" />
						</div>
					</div>
				{/if}

				<div class="field">
					<label for="email">Adresse e-mail</label>
					<div class="input-wrap">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="m3 7 9 7 9-7"/></svg>
						<input id="email" type="email" required bind:value={email} placeholder="toi@entreprise.fr" autocomplete="email" />
					</div>
				</div>

				<div class="field">
					<label for="password">Mot de passe</label>
					<div class="input-wrap password-wrap">
						<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
						<input
							id="password"
							type={passwordVisible ? 'text' : 'password'}
							required
							minlength="8"
							value={password}
							on:input={handlePasswordInput}
							placeholder="8 caractères minimum"
							autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
						/>
						<button
							type="button"
							class="eye-button"
							aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
							on:click={() => (passwordVisible = !passwordVisible)}
						>
							{#if passwordVisible}
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
							{:else}
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.1 3.8M6.2 6.2C3.4 8.1 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3-.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
							{/if}
						</button>
					</div>
				</div>

				{#if mode === 'signup'}
					<div class="password-hints">
						<div class="hint-title">Votre mot de passe doit contenir :</div>
						<div class="hint-row">✓ <span>Au moins 8 caractères</span></div>
						<div class="hint-row">✓ <span>Une majuscule et une minuscule</span></div>
						<div class="hint-row">✓ <span>Un chiffre</span></div>
						<div class="hint-row">✓ <span>Un caractère spécial</span></div>
					</div>
				{/if}

				{#if mode === 'signup'}
					<div class="field">
						<label for="confirmPassword">Confirmer le mot de passe</label>
						<div class="input-wrap password-wrap">
							<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
							<input
								id="confirmPassword"
								type={passwordVisible ? 'text' : 'password'}
								required
								value={confirmPassword}
								on:input={handleConfirmPasswordInput}
								placeholder="Confirmez votre mot de passe"
								autocomplete="new-password"
							/>
						</div>
					</div>
					<label class="terms-check">
						<input type="checkbox" bind:checked={acceptTerms} />
						<span>J’accepte les <a href="/conditions">conditions d’utilisation</a> et la <a href="/confidentialite">politique de confidentialité</a></span>
					</label>
				{/if}

				{#if mode === 'login'}
					<div class="form-meta">
						<label class="remember"><input type="checkbox" /> <span>Se souvenir de moi</span></label>
						<button type="button" class="forgot">Mot de passe oublié ?</button>
					</div>
				{/if}

				<button class="submit-button" disabled={loading} type="submit">
					<span>{loading ? (mode === 'login' ? 'Connexion...' : 'Création...') : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
					<span class="arrow">→</span>
				</button>
			</form>

			<div class="social-divider"><span></span> ou continuer avec <span></span></div>
			<div class="social-buttons">
				<button type="button" class="social-button" title="Connexion Google bientôt disponible">
					<span class="google-mark">G</span> Google
				</button>
				<button type="button" class="social-button" title="Connexion Apple bientôt disponible">
					<span class="apple-mark">●</span> Apple
				</button>
			</div>
			<div class="switch-account">
				{mode === 'login' ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?'}
				<button type="button" on:click={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
					{mode === 'login' ? 'Créer un compte' : 'Se connecter'}
				</button>
			</div>

			<div class="security-note">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
				<span>Vos données sont sécurisées avec <strong>Supabase</strong></span>
			</div>
		</div>
	</div>

	<div class="bottom-tag"><span></span> Ensemble, bâtissons un futur plus simple.</div>
</div>

<style>
	:global(body) { margin: 0; background: #07111f; }

	.auth-page {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
		width: 100vw;
		max-width: none;
		margin-left: calc(50% - 50vw);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 34px;
		box-sizing: border-box;
		background:
			linear-gradient(110deg, rgba(3,11,24,.06), rgba(3,11,24,.14)),
			url('/assets/backgrounds/chantierbot-reference.webp') center center / cover no-repeat;
		font-family: inherit;
		color: #f7f9fc;
	}

	.auth-page::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 16% 72%, rgba(255,168,36,.14), transparent 28%),
			radial-gradient(circle at 78% 16%, rgba(53,142,255,.10), transparent 30%),
			linear-gradient(180deg, rgba(3,12,25,.04), rgba(3,12,25,.18));
		pointer-events: none;
	}

	.blueprint-grid,
	.ambient { display: none; }

	.floating-window {
		position: relative;
		z-index: 2;
		width: min(940px, calc(100vw - 64px));
		height: min(680px, calc(100vh - 56px));
		min-height: 620px;
		display: grid;
		grid-template-columns: 46% 54%;
		overflow: hidden;
		border: 1px solid rgba(194,220,255,.52);
		border-radius: 34px;
		background: rgba(8,22,39,.12);
		box-shadow:
			0 45px 100px rgba(0,0,0,.55),
			0 0 0 1px rgba(255,255,255,.06),
			0 0 34px rgba(91,163,255,.11),
			inset 0 1px 0 rgba(255,255,255,.22);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		transform: perspective(1800px) rotateX(1deg) rotateZ(-.2deg);
	}

	.floating-window::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		background:
			linear-gradient(115deg, rgba(255,255,255,.17), transparent 17%, transparent 74%, rgba(255,173,37,.1)),
			radial-gradient(circle at 3% 92%, rgba(255,164,35,.27), transparent 22%);
		z-index: 8;
	}

	.floating-window::after {
		content: '';
		position: absolute;
		left: 4%;
		right: 4%;
		bottom: -1px;
		height: 2px;
		background: linear-gradient(90deg, transparent, #ffad25, #7fc4ff, transparent);
		filter: blur(2px);
		opacity: .8;
		z-index: 9;
	}

	.visual-panel {
		position: relative;
		min-width: 0;
		padding: 30px 38px 28px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-right: 1px solid rgba(192,216,247,.16);
		background: transparent;
		backdrop-filter: none;
	}

	.visual-panel::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(90deg, rgba(4,15,31,.08), rgba(4,15,31,.18)),
			radial-gradient(circle at 52% 72%, rgba(255,170,35,.10), transparent 30%);
		pointer-events: none;
	}

	.visual-panel::after {
		content: '';
		position: absolute;
		left: -20%;
		bottom: -17%;
		width: 65%;
		height: 45%;
		background: radial-gradient(ellipse, rgba(255,166,37,.32), transparent 68%);
		filter: blur(12px);
		pointer-events: none;
	}

	.brand-row {
		position: relative;
		z-index: 6;
		display: flex;
		align-items: center;
	}

	.brand-stack {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.brand-logo {
		width: 285px;
		height: auto;
		max-height: 78px;
		object-fit: contain;
		object-position: left center;
		filter: brightness(1.08) drop-shadow(0 7px 16px rgba(0,0,0,.25));
	}

	.brand-stack span {
		margin-left: 0;
	}

	.close-button {
		position: absolute;
		top: 22px;
		right: 24px;
		z-index: 20;
		width: 35px;
		height: 35px;
		border: 1px solid rgba(220,235,255,.4);
		border-radius: 50%;
		background: rgba(9,23,42,.28);
		color: rgba(245,250,255,.9);
		font-size: 25px;
		line-height: 30px;
		cursor: pointer;
		backdrop-filter: blur(8px);
		transition: .2s ease;
	}

	.close-button:hover {
		border-color: #ffb12c;
		color: #ffb12c;
		transform: rotate(90deg);
	}

	.visual-copy {
		position: relative;
		z-index: 6;
		margin-top: 20px;
		text-align: center;
	}

	.visual-copy h2 {
		margin: 0;
		font-size: clamp(25px, 2.5vw, 32px);
		line-height: 1.12;
		letter-spacing: -.035em;
		font-weight: 700;
		text-shadow: 0 3px 18px rgba(0,0,0,.28);
	}

	.visual-copy h2 strong {
		color: #fff;
		font-weight: 800;
	}

	.visual-copy p { display: none; }

	.feature-list {
		position: absolute;
		z-index: 6;
		left: 38px;
		bottom: 42px;
		display: grid;
		gap: 10px;
		margin: 0;
	}

	.feature-list div {
		display: flex;
		align-items: center;
		gap: 10px;
		color: rgba(242,248,255,.9);
		font-size: 12px;
		text-shadow: 0 2px 8px rgba(0,0,0,.3);
	}

	.feature-list span {
		width: 21px;
		height: 21px;
		display: grid;
		place-items: center;
		border: 1px solid rgba(255,255,255,.45);
		border-radius: 50%;
		background: rgba(255,255,255,.08);
		color: #fff;
		font-weight: 900;
	}

	.handwritten {
		position: absolute;
		z-index: 7;
		left: 50%;
		bottom: 10px;
		width: 170px;
		transform: translateX(-20%) rotate(-7deg);
		font-family: "Comic Sans MS", "Bradley Hand", cursive;
		font-size: 16px;
		font-style: italic;
		line-height: 1.05;
		color: rgba(255,255,255,.88);
		text-shadow: 0 2px 12px rgba(0,0,0,.4);
	}

	.handwritten::after {
		content: '';
		display: block;
		width: 105px;
		height: 3px;
		margin: 7px 0 0 34px;
		background: #ffad25;
		transform: rotate(-3deg);
		border-radius: 50%;
		box-shadow: 0 0 12px rgba(255,173,37,.45);
	}

	.form-panel {
		position: relative;
		z-index: 4;
		min-width: 0;
		padding: 42px 46px 36px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background:
			linear-gradient(145deg, rgba(12,31,57,.56), rgba(6,16,30,.68));
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	.form-top {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-bottom: 18px;
	}

	.mobile-logo { display: none; }

	.secure-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 10px;
		color: rgba(239,246,255,.58);
	}

	.secure-badge span,
	.bottom-tag span {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #35df9a;
		box-shadow: 0 0 10px #35df9a;
	}

	.mode-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		width: 100%;
		height: 58px;
		padding: 4px;
		box-sizing: border-box;
		border: 1px solid rgba(155,188,229,.18);
		border-radius: 16px;
		background: rgba(4,15,30,.32);
	}

	.mode-switch button {
		width: 100%;
		height: 50px;
		border: 0;
		border-radius: 12px;
		padding: 0 10px;
		background: transparent;
		color: rgba(229,238,250,.58);
		font: inherit;
		font-size: 14px;
		font-weight: 800;
		cursor: pointer;
		transition: .2s ease;
	}

	.mode-switch button.active {
		color: white;
		background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.07));
		border: 1px solid #ffb22e;
		box-shadow: 0 0 0 1px rgba(255,178,46,.2), 0 0 26px rgba(255,178,46,.19), inset 0 1px 0 rgba(255,255,255,.2);
	}

	.form-heading { margin: 25px 0 22px; }

	.small-kicker {
		display: block;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: .04em;
		color: rgba(245,249,255,.82);
	}

	.form-heading h1 {
		margin: 8px 0 8px;
		font-size: 30px;
		line-height: 1.1;
		letter-spacing: -.035em;
	}

	.form-heading p {
		margin: 0;
		color: rgba(222,235,252,.67);
		font-size: 13px;
	}

	form { display: grid; gap: 17px; }

	.field label {
		display: block;
		margin-bottom: 8px;
		color: rgba(244,248,253,.9);
		font-size: 12px;
		font-weight: 700;
	}

	.input-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
		height: 54px;
		padding: 0 15px;
		box-sizing: border-box;
		border: 1px solid rgba(183,209,243,.38);
		border-radius: 13px;
		background: rgba(18,35,58,.58);
		box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 5px 18px rgba(0,0,0,.08);
		transition: .2s ease;
	}

	.input-wrap:focus-within {
		border-color: rgba(255,181,45,.88);
		box-shadow: 0 0 0 3px rgba(255,181,45,.1), 0 9px 25px rgba(0,0,0,.12);
	}

	.input-wrap svg,
	.security-note svg {
		width: 20px;
		height: 20px;
		flex: 0 0 auto;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.7;
		color: rgba(218,233,252,.8);
	}

	.input-wrap input {
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
		color: white;
		font: inherit;
		font-size: 13px;
	}

	.input-wrap input::placeholder { color: rgba(202,220,243,.58); }

	.eye-button {
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		flex: 0 0 auto;
		border: 0;
		background: transparent;
		color: rgba(218,233,252,.72);
		cursor: pointer;
		border-radius: 8px;
	}

	.eye-button:hover { color: #ffb02a; background: rgba(255,176,43,.08); }
	.eye-button svg { width: 19px; height: 19px; }

	.form-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: -2px;
		font-size: 11px;
	}

	.remember {
		display: flex;
		align-items: center;
		gap: 7px;
		color: rgba(239,246,255,.8);
		cursor: pointer;
	}

	.remember input { width: 18px; height: 18px; accent-color: #ffad25; }

	.forgot {
		border: 0;
		background: transparent;
		color: #ffb02a;
		cursor: pointer;
		font-weight: 700;
	}

	.submit-button {
		width: 100%;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-top: 3px;
		border: 0;
		border-radius: 14px;
		background: linear-gradient(135deg, #ffc24c 0%, #ff9e1c 100%);
		color: #121a25;
		font-weight: 900;
		font-size: 15px;
		cursor: pointer;
		box-shadow: 0 13px 29px rgba(245,154,28,.3), inset 0 1px 0 rgba(255,255,255,.46);
		transition: transform .18s ease, box-shadow .18s ease;
	}

	.submit-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 18px 35px rgba(245,154,28,.38), inset 0 1px 0 rgba(255,255,255,.46);
	}

	.submit-button:disabled { opacity: .55; cursor: wait; }
	.arrow { font-size: 22px; line-height: 1; }

	.password-hints {
		margin-top: -4px;
		padding: 11px 13px;
		border: 1px solid rgba(255,255,255,.08);
		border-radius: 13px;
		background: rgba(3,13,25,.34);
		font-size: 10px;
		color: rgba(239,246,255,.55);
	}

	.hint-title { color: rgba(239,246,255,.78); margin-bottom: 6px; font-weight: 700; }
	.hint-row { color: #35df9a; line-height: 1.65; }
	.hint-row span { color: rgba(239,246,255,.62); margin-left: 5px; }

	.terms-check {
		display: flex;
		align-items: flex-start;
		gap: 9px;
		font-size: 10px;
		line-height: 1.45;
		color: rgba(239,246,255,.62);
		cursor: pointer;
	}

	.terms-check input { margin-top: 2px; accent-color: #ffad25; }
	.terms-check a { color: #ffb02a; text-decoration: underline; }

	.social-divider {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 18px 0 12px;
		font-size: 10px;
		color: rgba(205,221,242,.58);
	}

	.social-divider span { flex: 1; height: 1px; background: rgba(255,255,255,.13); }

	.social-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }

	.social-button {
		height: 48px;
		border: 1px solid rgba(183,209,243,.3);
		border-radius: 13px;
		background: rgba(30,49,76,.5);
		color: rgba(246,249,253,.9);
		font: inherit;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		transition: .2s ease;
	}

	.social-button:hover {
		border-color: rgba(255,176,43,.5);
		background: rgba(255,255,255,.08);
	}

	.google-mark { color: #4285f4; font-weight: 900; font-size: 17px; margin-right: 6px; }
	.apple-mark { color: white; font-size: 13px; margin-right: 6px; }

	.switch-account {
		text-align: center;
		margin-top: 16px;
		color: rgba(205,221,242,.66);
		font-size: 11px;
	}

	.switch-account button {
		border: 0;
		background: transparent;
		color: #ffb02a;
		font-weight: 800;
		cursor: pointer;
		padding: 0 0 0 4px;
	}

	.security-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 18px;
		color: rgba(205,221,242,.5);
		font-size: 10px;
	}

	.security-note strong { color: #66bfff; font-weight: 600; }
	.security-note svg { width: 17px; height: 17px; }

	.bottom-tag {
		position: absolute;
		z-index: 12;
		bottom: 15px;
		right: 20px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 13px;
		border: 1px solid rgba(255,255,255,.16);
		border-radius: 999px;
		background: rgba(5,12,22,.5);
		backdrop-filter: blur(12px);
		font-size: 10px;
		color: rgba(239,246,255,.62);
	}

	@media (max-width: 900px) {
		.auth-page { padding: 16px; }
		.floating-window {
			width: min(560px, 100%);
			height: auto;
			min-height: 0;
			grid-template-columns: 1fr;
			transform: none;
		}
		.visual-panel { display: none; }
		.form-panel { padding: 30px 26px; }
		.mobile-logo { display: block; }
		.mobile-logo img { width: 165px; }
		.bottom-tag { display: none; }
	}

	@media (max-width: 480px) {
		.auth-page { padding: 10px; }
		.floating-window { border-radius: 22px; }
		.form-panel { padding: 24px 18px; }
		.form-heading { margin-top: 24px; }
		.form-heading h1 { font-size: 25px; }
		.social-buttons { grid-template-columns: 1fr; }
	}
</style>
