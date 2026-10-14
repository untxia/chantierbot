<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import {
		formatValue,
		polygonAreaXZ,
		polylineLength3,
		distance3,
		projectToScreen,
		type Kind,
		type Vec3
	} from '$lib/measure';

	export let kind: Kind = 'longueur';

	const dispatch = createEventDispatcher<{ done: { value: number; kind: Kind }; error: string }>();

	// Les objets WebXR sont typés `any` : les types @types/webxr ne sont pas installés.
	let overlay: HTMLDivElement;
	let drawCanvas: HTMLCanvasElement;
	let active = false;
	let points: Vec3[] = [];
	let reticle: Vec3 | null = null;
	let session: any = null;
	let hitSource: any = null;
	let pending: { value: number; kind: Kind } | null = null;
	let sessionKind: Kind = 'longueur';

	$: minPoints = sessionKind === 'surface' ? 3 : 2;
	$: current = computeValue(points, sessionKind);
	$: hint = !reticle
		? 'Bougez lentement le téléphone pour détecter une surface…'
		: points.length === 0
			? 'Visez le premier point puis touchez l’écran.'
			: points.length < minPoints
				? `Touchez pour poser le point suivant (${minPoints - points.length} minimum).`
				: 'Continuez ou touchez « Terminer ».';

	function computeValue(pts: Vec3[], k: Kind): number {
		if (k === 'surface') return polygonAreaXZ(pts);
		return polylineLength3(pts);
	}

	export async function start() {
		const xr = (navigator as any).xr;
		if (!xr) {
			dispatch('error', 'La réalité augmentée n’est pas disponible sur cet appareil.');
			return;
		}
		points = [];
		reticle = null;
		pending = null;
		sessionKind = kind;

		try {
			session = await xr.requestSession('immersive-ar', {
				requiredFeatures: ['hit-test'],
				optionalFeatures: ['dom-overlay'],
				domOverlay: { root: overlay }
			});
		} catch (err) {
			session = null;
			dispatch('error', err instanceof Error ? err.message : 'Impossible de démarrer la réalité augmentée.');
			return;
		}

		try {
			const glCanvas = document.createElement('canvas');
			const gl = glCanvas.getContext('webgl', { xrCompatible: true }) as WebGLRenderingContext;
			session.updateRenderState({ baseLayer: new (window as any).XRWebGLLayer(session, gl) });
			const refSpace = await session.requestReferenceSpace('local');
			const viewerSpace = await session.requestReferenceSpace('viewer');
			hitSource = await session.requestHitTestSource({ space: viewerSpace });

			session.addEventListener('select', onSelect);
			session.addEventListener('end', onEnd);
			active = true;

			const onFrame = (_t: number, frame: any) => {
				if (!session) return;
				session.requestAnimationFrame(onFrame);

				const layer = session.renderState.baseLayer;
				gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
				gl.clearColor(0, 0, 0, 0);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

				const hits = hitSource ? frame.getHitTestResults(hitSource) : [];
				const pose = hits.length ? hits[0].getPose(refSpace) : null;
				reticle = pose
					? { x: pose.transform.position.x, y: pose.transform.position.y, z: pose.transform.position.z }
					: null;

				const viewerPose = frame.getViewerPose(refSpace);
				if (viewerPose && viewerPose.views.length) draw(viewerPose.views[0]);
			};
			session.requestAnimationFrame(onFrame);
		} catch (err) {
			dispatch('error', err instanceof Error ? err.message : 'Échec de l’initialisation de la réalité augmentée.');
			session?.end().catch(() => {});
		}
	}

	/** Évite qu'un appui sur un bouton de l'overlay pose aussi un point. */
	function keepOutOfXrSelect(node: HTMLElement) {
		const stop = (e: Event) => e.preventDefault();
		node.addEventListener('beforexrselect', stop);
		return { destroy: () => node.removeEventListener('beforexrselect', stop) };
	}

	function onSelect() {
		if (reticle) points = [...points, { ...reticle }];
	}

	function onEnd() {
		hitSource?.cancel?.();
		hitSource = null;
		session = null;
		active = false;
		reticle = null;
		if (pending) {
			dispatch('done', pending);
			pending = null;
		}
	}

	function undo() {
		points = points.slice(0, -1);
	}

	function finish() {
		if (points.length < minPoints) return;
		pending = { value: current, kind: sessionKind };
		session?.end();
	}

	function cancel() {
		pending = null;
		session?.end();
	}

	function draw(view: any) {
		const w = overlay.clientWidth;
		const h = overlay.clientHeight;
		const dpr = window.devicePixelRatio || 1;
		if (drawCanvas.width !== w * dpr || drawCanvas.height !== h * dpr) {
			drawCanvas.width = w * dpr;
			drawCanvas.height = h * dpr;
		}
		const ctx = drawCanvas.getContext('2d')!;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);

		const inv = view.transform.inverse.matrix;
		const proj = view.projectionMatrix;
		const toScreen = (p: Vec3) => projectToScreen(inv, proj, p, w, h);

		const path = [...points];
		const liveEnd = reticle && points.length > 0 ? reticle : null;
		const screen = path.map(toScreen);
		const liveScreen = liveEnd ? toScreen(liveEnd) : null;

		ctx.lineWidth = 3;
		ctx.strokeStyle = '#ffad25';
		ctx.fillStyle = '#ffad25';
		ctx.font = '600 14px Manrope, system-ui, sans-serif';
		ctx.textAlign = 'center';

		const chain = [...screen, ...(liveScreen ? [liveScreen] : [])];
		const worldChain = [...path, ...(liveEnd ? [liveEnd] : [])];
		for (let i = 1; i < chain.length; i++) {
			const a = chain[i - 1];
			const b = chain[i];
			if (!a || !b) continue;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
			// Longueur du segment, au milieu.
			const label = formatValue(distance3(worldChain[i - 1], worldChain[i]), 'longueur');
			const mx = (a.x + b.x) / 2;
			const my = (a.y + b.y) / 2 - 10;
			ctx.fillStyle = 'rgba(11,16,32,.75)';
			ctx.fillRect(mx - ctx.measureText(label).width / 2 - 6, my - 14, ctx.measureText(label).width + 12, 22);
			ctx.fillStyle = '#fff';
			ctx.fillText(label, mx, my + 2);
			ctx.fillStyle = '#ffad25';
		}
		if (sessionKind === 'surface' && screen.length >= 3 && screen.every(Boolean)) {
			ctx.beginPath();
			screen.forEach((s, i) => (i === 0 ? ctx.moveTo(s!.x, s!.y) : ctx.lineTo(s!.x, s!.y)));
			ctx.closePath();
			ctx.fillStyle = 'rgba(255,173,37,.22)';
			ctx.fill();
			ctx.fillStyle = '#ffad25';
		}
		for (const s of screen) {
			if (!s) continue;
			ctx.beginPath();
			ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
			ctx.fill();
		}
		const r = reticle ? toScreen(reticle) : null;
		if (r) {
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(r.x, r.y, 14, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
			ctx.fillStyle = '#fff';
			ctx.fill();
		}
	}

	onDestroy(() => {
		session?.end?.().catch?.(() => {});
	});
</script>

<!-- Racine du dom-overlay : n'est visible que pendant la session AR. -->
<div bind:this={overlay} class="ar-overlay" class:ar-active={active}>
	<canvas bind:this={drawCanvas} class="ar-canvas"></canvas>

	<div class="ar-top">
		<p class="ar-total">{formatValue(current, sessionKind)}</p>
		<p class="ar-hint">{hint}</p>
	</div>

	<div class="ar-bar">
		<button type="button" use:keepOutOfXrSelect on:click={cancel}>Quitter</button>
		<button type="button" use:keepOutOfXrSelect on:click={undo} disabled={points.length === 0}>Annuler le point</button>
		<button type="button" class="primary" use:keepOutOfXrSelect on:click={finish} disabled={points.length < minPoints}>Terminer</button>
	</div>
</div>

<style>
	.ar-overlay {
		position: fixed;
		inset: 0;
		z-index: -1;
		opacity: 0;
		pointer-events: none;
		color: #fff;
		font-family: Manrope, system-ui, sans-serif;
	}
	.ar-overlay.ar-active {
		z-index: 9999;
		opacity: 1;
		pointer-events: auto;
	}
	.ar-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.ar-top {
		position: absolute;
		top: max(16px, env(safe-area-inset-top));
		left: 16px;
		right: 16px;
		text-align: center;
	}
	.ar-total {
		margin: 0;
		font-size: 34px;
		font-weight: 800;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
	}
	.ar-hint {
		margin: 6px auto 0;
		max-width: 320px;
		padding: 6px 12px;
		border-radius: 999px;
		background: rgba(11, 16, 32, 0.7);
		font-size: 13px;
	}
	.ar-bar {
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: max(16px, env(safe-area-inset-bottom));
		display: flex;
		gap: 8px;
	}
	.ar-bar button {
		flex: 1;
		min-height: 48px;
		border: 1px solid rgba(255, 255, 255, 0.35);
		border-radius: 14px;
		background: rgba(11, 16, 32, 0.75);
		color: #fff;
		font-size: 14px;
		font-weight: 700;
	}
	.ar-bar button.primary {
		border-color: transparent;
		background: linear-gradient(135deg, #ffbf47, #ff9f1a);
		color: #1a1200;
	}
	.ar-bar button:disabled {
		opacity: 0.45;
	}
</style>
