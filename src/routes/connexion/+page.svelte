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
				<img src="/logo/logo-horizontal-light.svg" alt="ChantierBot" class="brand-logo" />
			</div>

			<div class="visual-copy">
				<span class="eyebrow">COPILOTE IA POUR ARTISANS</span>
				<h2>Moins d'administratif,<br /><strong>plus de chantiers.</strong></h2>
				<p>L'IA au service de tes chantiers pour organiser, analyser et anticiper.</p>
			</div>

			<div class="robot-card" aria-hidden="true">
				<div class="robot-halo"></div>
				<div class="helmet">CB</div>
				<div class="robot-face">
					<span></span><span></span>
					<div class="robot-smile"></div>
				</div>
				<div class="robot-body">CHANTIERBOT</div>
			</div>

			<div class="feature-list">
				<div><span>✓</span> Gère tes chantiers</div>
				<div><span>✓</span> Analyse tes photos avec l'IA</div>
				<div><span>✓</span> Planifie tes journées</div>
				<div><span>✓</span> Anticipe tes stocks</div>
			</div>
		</div>

		<div class="form-panel">
			<div class="form-top">
				<div class="mobile-logo">
					<img src="/logo/logo-horizontal-light.svg" alt="ChantierBot" />
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
				<h1>{mode === 'login' ? 'Ravi de te revoir !' : 'Crée ton espace chantier'}</h1>
				<p>{mode === 'login' ? 'Connecte-toi pour retrouver tous tes chantiers.' : 'Quelques secondes pour commencer avec ChantierBot.'}</p>
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

				{#if mode === 'login'}
					<div class="form-meta">
						<label class="remember"><input type="checkbox" /> <span>Se souvenir de moi</span></label>
						<button type="button" class="forgot">Mot de passe oublié ?</button>
					</div>
				{/if}

				<button class="submit-button" disabled={loading} type="submit">
					<span>{loading ? 'Connexion...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
					<span class="arrow">→</span>
				</button>
			</form>

			<div class="security-note">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>
				<span>Tes données sont protégées et sécurisées.</span>
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
			radial-gradient(circle at 18% 20%, rgba(246, 166, 35, .18), transparent 28%),
			radial-gradient(circle at 86% 78%, rgba(35, 128, 255, .18), transparent 32%),
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
		width: min(1100px, 100%);
		min-height: 650px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		border: 1px solid rgba(255,255,255,.22);
		border-radius: 30px;
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
		padding: 42px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: linear-gradient(145deg, rgba(16,39,70,.86), rgba(8,19,34,.64));
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
	.brand-logo { width: 180px; height: auto; }
	.visual-copy { position: relative; z-index: 2; margin-top: 30px; }
	.eyebrow, .small-kicker {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: .16em;
		color: #ffb12b;
	}
	.visual-copy h2 {
		margin: 14px 0 12px;
		font-size: clamp(30px, 3.4vw, 46px);
		line-height: 1.04;
		letter-spacing: -.035em;
	}
	.visual-copy h2 strong { color: #ffad25; }
	.visual-copy p { max-width: 390px; color: rgba(239,246,255,.7); font-size: 15px; line-height: 1.7; }
	.robot-card {
		position: absolute;
		right: 30px;
		top: 170px;
		width: 215px;
		height: 250px;
		transform: rotate(5deg);
		filter: drop-shadow(0 30px 30px rgba(0,0,0,.38));
	}
	.robot-halo {
		position: absolute;
		inset: 8px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(56,144,255,.32), transparent 66%);
		filter: blur(5px);
	}
	.helmet {
		position: absolute;
		left: 62px;
		top: 18px;
		width: 92px;
		height: 50px;
		border-radius: 50px 50px 20px 20px;
		background: linear-gradient(145deg,#ffc34a,#ec8e17);
		color: #17263a;
		font-weight: 900;
		display: grid;
		place-items: center;
		box-shadow: inset 0 5px 8px rgba(255,255,255,.35), 0 10px 20px rgba(0,0,0,.25);
	}
	.robot-face {
		position: absolute;
		left: 42px;
		top: 54px;
		width: 132px;
		height: 105px;
		border-radius: 38px;
		background: linear-gradient(145deg,#f6f9ff,#9eacc2);
		box-shadow: inset 0 -10px 20px rgba(52,69,92,.18);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 25px;
	}
	.robot-face::before {
		content: '';
		position: absolute;
		inset: 17px;
		border-radius: 28px;
		background: #0b1627;
		box-shadow: inset 0 0 18px rgba(52,154,255,.35);
	}
	.robot-face > span {
		position: relative;
		z-index: 1;
		width: 10px;
		height: 17px;
		border-radius: 50%;
		background: #61c9ff;
		box-shadow: 0 0 12px #61c9ff;
	}
	.robot-smile { position: absolute; z-index: 1; width: 28px; height: 12px; border-bottom: 3px solid #61c9ff; border-radius: 0 0 20px 20px; top: 59px; }
	.robot-body {
		position: absolute;
		left: 31px;
		top: 145px;
		width: 155px;
		height: 95px;
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
	.feature-list { position: relative; z-index: 2; display: grid; gap: 12px; margin-top: 34px; }
	.feature-list div { display: flex; align-items: center; gap: 10px; color: rgba(239,246,255,.78); font-size: 13px; }
	.feature-list span { width: 21px; height: 21px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,174,43,.15); color: #ffb02a; font-weight: 900; }

	.form-panel {
		padding: 40px 46px;
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
		box-shadow: 0 5px 18px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.08);
	}
	.form-heading { margin: 30px 0 24px; }
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
	.security-note { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 24px; color: rgba(205,221,242,.42); font-size: 10px; }
	.security-note svg { width: 16px; height: 16px; }
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
