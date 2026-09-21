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
				<img src="/logo/logo-horizontal-dark.svg" alt="ChantierBot" class="brand-logo" />
			</div>

			<div class="visual-copy">
				<h2>« Moins d'administratif,<br /><strong>plus de chantiers ! »</strong></h2>
				<p>L'IA au service des artisans pour organiser, analyser et anticiper chaque étape.</p>
			</div>

			<div class="robot-card" aria-hidden="true">
				<div class="robot-halo"></div>
				<div class="helmet"><span>CB</span></div>
				<div class="helmet-brim"></div>
				<div class="robot-face">
					<span></span><span></span>
					<div class="robot-smile"></div>
				</div>
				<div class="robot-body">
					<div class="robot-chest">CB</div>
				</div>
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
	:global(body) {
		margin: 0;
	}
	.auth-page {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
		background:
			linear-gradient(90deg, rgba(4, 13, 24, .72), rgba(4, 13, 24, .9)),
			url('/assets/backgrounds/chantier-general.webp') center / cover no-repeat,
			linear-gradient(135deg, #07111f 0%, #0a1729 46%, #101827 100%);
		font-family: inherit;
		color: #f7f9fc;
	}
	.blueprint-grid {
		position: absolute;
		inset: 0;
		opacity: .13;
		background-image: linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
		background-size: 44px 44px;
		mask-image: radial-gradient(circle at center, black, transparent 80%);
	}
	.ambient {
		position: absolute;
		border-radius: 999px;
		filter: blur(2px);
		pointer-events: none;
	}
	.ambient-one { width: 420px; height: 420px; background: rgba(255, 169, 39, .12); left: -160px; top: 8%; }
	.ambient-two { width: 520px; height: 520px; background: rgba(43, 126, 255, .1); right: -190px; bottom: -160px; }

	.floating-window {
		position: relative;
		z-index: 2;
		width: min(1080px, 100%);
		min-height: 700px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		border: 1px solid rgba(255,255,255,.22);
		border-radius: 28px;
		overflow: hidden;
		background: rgba(14, 26, 44, .68);
		backdrop-filter: blur(24px) saturate(145%);
		-webkit-backdrop-filter: blur(24px) saturate(145%);
		box-shadow: 0 45px 100px rgba(0,0,0,.48), 0 12px 35px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.16);
		transform: perspective(1800px) rotateX(1deg);
	}
	.floating-window::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		background: linear-gradient(115deg, rgba(255,255,255,.11), transparent 24%, transparent 72%, rgba(255,173,45,.08));
	}
	.visual-panel {
		position: relative;
		padding: 42px 46px 38px;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		background:
			linear-gradient(145deg, rgba(8,28,52,.72), rgba(5,15,28,.84)),
			url('/assets/backgrounds/chantier-general.webp') center / cover no-repeat;
		border-right: 1px solid rgba(255,255,255,.1);
		overflow: hidden;
	}
	.visual-panel::after {
		content: '';
		position: absolute;
		inset: auto -20% -22% -15%;
		height: 48%;
		background: radial-gradient(ellipse, rgba(255,168,37,.18), transparent 68%);
	}
	.brand-row { position: relative; z-index: 2; }
	.brand-logo { width: 205px; height: auto; filter: drop-shadow(0 8px 18px rgba(0,0,0,.18)); }
	.visual-copy { position: relative; z-index: 4; margin-top: 34px; max-width: 445px; }
	.visual-copy h2 {
		margin: 0 0 14px;
		font-size: clamp(32px, 3.45vw, 45px);
		line-height: 1.03;
		letter-spacing: -.042em;
		color: #f8fbff;
	}
	.visual-copy h2 strong { color: #ffad25; text-shadow: 0 0 22px rgba(255,173,37,.16); }
	.visual-copy p { max-width: 410px; margin: 0; color: rgba(239,246,255,.72); font-size: 13px; line-height: 1.55; }
	.robot-card {
		position: absolute;
		z-index: 3;
		left: 50%;
		top: 326px;
		width: 250px;
		height: 275px;
		transform: translateX(-50%) rotate(1deg);
		filter: drop-shadow(0 32px 32px rgba(0,0,0,.48));
	}
	.robot-halo {
		position: absolute;
		inset: 4px -35px 0;
		border-radius: 50%;
		background: radial-gradient(ellipse at center, rgba(52,145,255,.28), rgba(52,145,255,.08) 38%, transparent 70%);
		filter: blur(13px);
	}
	.helmet {
		position: absolute;
		left: 67px;
		top: 4px;
		width: 116px;
		height: 57px;
		border-radius: 50px 50px 20px 20px;
		background: linear-gradient(145deg,#ffc34a,#ec8e17);
		color: #17263a;
		font-weight: 900;
		display: grid;
		place-items: center;
		box-shadow: inset 0 5px 8px rgba(255,255,255,.35), 0 10px 20px rgba(0,0,0,.25);
	}
	.helmet::after {
		content: '';
		position: absolute;
		left: -12px;
		bottom: -9px;
		width: 140px;
		height: 18px;
		border-radius: 50%;
		background: linear-gradient(180deg, #f2a21f, #c87512);
		box-shadow: 0 5px 10px rgba(0,0,0,.2);
	}
	.robot-face {
		position: absolute;
		left: 27px;
		top: 51px;
		width: 196px;
		height: 142px;
		border-radius: 47px;
		background: linear-gradient(145deg,#f6f9ff,#9eacc2);
		box-shadow: inset 0 -10px 20px rgba(52,69,92,.18);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 35px;
	}
	.robot-face::before {
		content: '';
		position: absolute;
		inset: 18px;
		border-radius: 34px;
		background: radial-gradient(circle at 50% 20%, #13263f, #07111e 70%);

		box-shadow: inset 0 0 18px rgba(52,154,255,.35);
	}
	.robot-face > span {
		position: relative;
		z-index: 1;
		width: 12px;
		height: 19px;
		border-radius: 50%;
		background: #61c9ff;
		box-shadow: 0 0 12px #61c9ff;
	}
	.robot-smile { position: absolute; z-index: 1; width: 34px; height: 14px; border-bottom: 3px solid #61c9ff; border-radius: 0 0 20px 20px; top: 77px; }
	.robot-body {
		position: absolute;
		left: 38px;
		top: 174px;
		width: 174px;
		height: 88px;
		border-radius: 38px 38px 22px 22px;
		background: linear-gradient(145deg,#e9eff7,#8492a7);
		color: #27364b;
		display: grid;
		place-items: center;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: .13em;
		border: 4px solid rgba(255,255,255,.28);
	}
	.feature-list {
		position: absolute;
		left: 46px;
		bottom: 74px;
		z-index: 5;
		display: grid;
		gap: 11px;
		margin: 0;
	}
	.feature-list div { display: flex; align-items: center; gap: 10px; color: rgba(239,246,255,.88); font-size: 12px; }
	.feature-list span { width: 21px; height: 21px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,174,43,.15); color: #ffb02a; font-weight: 900; }

	.form-panel {
		padding: 42px 46px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background: rgba(6, 15, 27, .42);
	}
	.form-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
	.mobile-logo { display: none; }
	.secure-badge { display: flex; align-items: center; gap: 8px; margin-left: auto; font-size: 11px; color: rgba(239,246,255,.55); }
	.secure-badge span, .bottom-tag span { width: 7px; height: 7px; border-radius: 50%; background: #35df9a; box-shadow: 0 0 10px #35df9a; }
	.mode-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: 4px;
		border: 1px solid rgba(255,255,255,.1);
		border-radius: 14px;
		background: rgba(255,255,255,.035);
	}
	.mode-switch button {
		border: 0;
		border-radius: 10px;
		padding: 11px;
		background: transparent;
		color: rgba(239,246,255,.55);
		font-weight: 800;
		cursor: pointer;
		transition: .2s ease;
	}
	.mode-switch button.active {
		color: white;
		background: rgba(255,255,255,.1);
		border: 1px solid rgba(255,176,43,.82);
		box-shadow: 0 0 0 1px rgba(255,176,43,.16), 0 0 24px rgba(255,176,43,.14), 0 5px 18px rgba(0,0,0,.18);
		box-shadow: 0 5px 18px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.08);
	}
	.form-heading { margin: 26px 0 22px; }
	.form-heading h1 { margin: 7px 0 7px; font-size: 29px; letter-spacing: -.03em; }
	.form-heading p { margin: 0; color: rgba(239,246,255,.56); font-size: 13px; }
	form { display: grid; gap: 17px; }
	.field label { display: block; margin-bottom: 7px; color: rgba(239,246,255,.84); font-size: 12px; font-weight: 700; }
	.input-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 50px;
		padding: 0 13px;
		border: 1px solid rgba(182,204,231,.24);
		border-radius: 13px;
		background: rgba(255,255,255,.045);
		box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
		transition: .2s ease;
	}
	.input-wrap:focus-within { border-color: rgba(255,176,43,.75); box-shadow: 0 0 0 3px rgba(255,176,43,.1), 0 10px 28px rgba(0,0,0,.12); }
	.input-wrap svg, .security-note svg { width: 19px; height: 19px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.7; color: rgba(205,221,242,.55); }
	.input-wrap input { width: 100%; border: 0; outline: 0; background: transparent; color: white; font: inherit; font-size: 13px; }
	.input-wrap input::placeholder { color: rgba(205,221,242,.4); }
	.eye-button { width: 34px; height: 34px; display: grid; place-items: center; flex: 0 0 auto; border: 0; background: transparent; color: rgba(205,221,242,.55); cursor: pointer; border-radius: 8px; }
	.eye-button:hover { color: #ffb02a; background: rgba(255,176,43,.08); }
	.eye-button svg { width: 19px; height: 19px; }
	.form-meta { display: flex; align-items: center; justify-content: space-between; margin-top: -2px; font-size: 11px; }
	.remember { display: flex; align-items: center; gap: 7px; color: rgba(239,246,255,.56); cursor: pointer; }
	.remember input { accent-color: #ffac24; }
	.forgot { border: 0; background: transparent; color: #ffb02a; cursor: pointer; font-weight: 700; }
	.submit-button {
		width: 100%;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		margin-top: 4px;
		border: 0;
		border-radius: 13px;
		background: linear-gradient(135deg, #ffbe43, #f39818);
		color: #17202d;
		font-weight: 900;
		font-size: 14px;
		cursor: pointer;
		box-shadow: 0 12px 28px rgba(245,154,28,.25), inset 0 1px 0 rgba(255,255,255,.4);
		transition: transform .18s ease, box-shadow .18s ease;
	}
	.submit-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 17px 32px rgba(245,154,28,.32), inset 0 1px 0 rgba(255,255,255,.4); }
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
	.security-note { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; color: rgba(205,221,242,.42); font-size: 10px; }
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
		color: rgba(205,221,242,.48);
	}
	.social-divider span { flex: 1; height: 1px; background: rgba(255,255,255,.09); }
	.social-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
	.social-button {
		height: 45px;
		border: 1px solid rgba(182,204,231,.22);
		border-radius: 12px;
		background: rgba(255,255,255,.045);
		color: rgba(239,246,255,.82);
		font: inherit;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		transition: .2s ease;
	}
	.social-button:hover { border-color: rgba(255,176,43,.5); background: rgba(255,255,255,.07); }
	.google-mark { color: #4285f4; font-weight: 900; font-size: 17px; margin-right: 6px; }
	.apple-mark { color: white; font-size: 13px; margin-right: 6px; }
	.switch-account { text-align: center; margin-top: 14px; color: rgba(205,221,242,.5); font-size: 10px; }
	.switch-account button { border: 0; background: transparent; color: #ffb02a; font-weight: 800; cursor: pointer; padding: 0 0 0 4px; }
	.security-note strong { color: rgba(87,181,255,.9); font-weight: 600; }
	.security-note svg { width: 16px; height: 16px; }
	.handwritten {
		position: absolute;
		z-index: 6;
		left: 46px;
		bottom: 12px;
		font-family: "Comic Sans MS", "Bradley Hand", cursive;
		font-size: 17px;
		font-style: italic;
		line-height: 1.12;
		color: rgba(255,255,255,.84);
		transform: rotate(-7deg);
		text-shadow: 0 2px 12px rgba(0,0,0,.35);
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
		box-shadow: 0 0 12px rgba(255,173,37,.4);
	}
	.bottom-tag {
		position: absolute;
		z-index: 3;
		bottom: 17px;
		right: 25px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 13px;
		border: 1px solid rgba(255,255,255,.12);
		border-radius: 999px;
		background: rgba(5,12,22,.42);
		backdrop-filter: blur(12px);
		font-size: 10px;
		color: rgba(239,246,255,.5);
	}
	@media (max-width: 900px) {
		.auth-page { padding: 20px; }
		.floating-window { grid-template-columns: 1fr; min-height: auto; max-width: 560px; transform: none; }
		.visual-panel { display: none; }
		.form-panel { padding: 30px 26px; }
		.mobile-logo { display: block; }
		.mobile-logo img { width: 150px; }
		.bottom-tag { display: none; }
	}
	@media (max-width: 480px) {
		.auth-page { padding: 12px; }
		.floating-window { border-radius: 22px; }
		.form-panel { padding: 24px 18px; }
		.form-heading { margin-top: 24px; }
		.form-heading h1 { font-size: 25px; }
	}
</style>
