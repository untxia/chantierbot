<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import {
		formatValue,
		metersPerPixel,
		polygonArea2,
		polylineLength2,
		type Kind,
		type Vec2
	} from '$lib/measure';

	export let kind: Kind = 'longueur';

	const dispatch = createEventDispatcher<{ done: { value: number; kind: Kind } }>();

	let canvas: HTMLCanvasElement;
	let image: HTMLImageElement | null = null;
	let objectUrl: string | null = null;
	let step: 'calibrate' | 'measure' = 'calibrate';
	let calibration: Vec2[] = [];
	let realCm = '';
	let mpp: number | null = null;
	let points: Vec2[] = [];

	$: minPoints = kind === 'surface' ? 3 : 2;
	$: value = mpp === null ? 0 : kind === 'surface' ? polygonArea2(points) * mpp * mpp : polylineLength2(points) * mpp;
	$: if (canvas && image) redraw(calibration, points, step);

	function onFile(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		if (objectUrl) URL.revokeObjectURL(objectUrl);
		objectUrl = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			image = img;
			reset();
		};
		img.src = objectUrl;
	}

	function reset() {
		step = 'calibrate';
		calibration = [];
		points = [];
		realCm = '';
		mpp = null;
	}

	function applyCalibration() {
		const cm = Number(realCm.replace(',', '.'));
		if (calibration.length !== 2 || !(cm > 0)) return;
		mpp = metersPerPixel(calibration[0], calibration[1], cm / 100);
		if (mpp !== null) step = 'measure';
	}

	function onPointer(event: PointerEvent) {
		if (!image) return;
		const rect = canvas.getBoundingClientRect();
		const p = {
			x: ((event.clientX - rect.left) / rect.width) * image.naturalWidth,
			y: ((event.clientY - rect.top) / rect.height) * image.naturalHeight
		};
		if (step === 'calibrate') {
			if (calibration.length < 2) calibration = [...calibration, p];
		} else {
			points = [...points, p];
		}
	}

	function undo() {
		if (step === 'calibrate') calibration = calibration.slice(0, -1);
		else points = points.slice(0, -1);
	}

	function redraw(calib: Vec2[], pts: Vec2[], currentStep: string) {
		if (!image) return;
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(image, 0, 0);

		const unit = Math.max(canvas.width, canvas.height) / 400; // épaisseurs proportionnelles à l'image
		const stroke = (list: Vec2[], color: string, close: boolean) => {
			if (list.length === 0) return;
			ctx.strokeStyle = color;
			ctx.fillStyle = color;
			ctx.lineWidth = 2.5 * unit;
			ctx.beginPath();
			list.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
			if (close && list.length >= 3) ctx.closePath();
			ctx.stroke();
			for (const p of list) {
				ctx.beginPath();
				ctx.arc(p.x, p.y, 4 * unit, 0, Math.PI * 2);
				ctx.fill();
			}
		};
		stroke(calib, '#38bdf8', false);
		if (currentStep === 'measure') stroke(pts, '#ffad25', kind === 'surface');
	}

	function finish() {
		if (points.length < minPoints || value <= 0) return;
		dispatch('done', { value, kind });
	}

	onDestroy(() => {
		if (objectUrl) URL.revokeObjectURL(objectUrl);
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-1">
		<label for="photo-file" class="text-sm font-medium">Photo du chantier</label>
		<input id="photo-file" type="file" accept="image/*" capture="environment" on:change={onFile} class="input" />
	</div>

	{#if image}
		<p class="text-sm text-ink-secondary dark:text-ink-dark-secondary">
			{#if step === 'calibrate'}
				<strong>Étape 1 — Étalonnage.</strong> Touchez les deux extrémités d’un objet dont vous connaissez la longueur
				(mètre ruban, porte standard 204 cm…), puis saisissez sa longueur réelle.
			{:else}
				<strong>Étape 2 — Mesure.</strong> Touchez les points à mesurer
				{kind === 'surface' ? '(au moins 3, le contour se referme tout seul).' : '(au moins 2).'}
			{/if}
		</p>

		<canvas
			bind:this={canvas}
			on:pointerdown|preventDefault={onPointer}
			class="max-h-[70vh] w-full touch-none rounded-lg border border-black/10 object-contain dark:border-white/10"
		></canvas>

		{#if step === 'calibrate'}
			<div class="flex flex-wrap items-end gap-2">
				<div class="flex flex-col gap-1">
					<label for="real-cm" class="text-sm font-medium">Longueur réelle (cm)</label>
					<input id="real-cm" type="text" inputmode="decimal" bind:value={realCm} placeholder="Ex : 204" class="input w-40" />
				</div>
				<button type="button" class="btn-primary" disabled={calibration.length !== 2 || !(Number(realCm.replace(',', '.')) > 0)} on:click={applyCalibration}>
					Valider l’étalonnage
				</button>
				<button type="button" class="btn-secondary" disabled={calibration.length === 0} on:click={undo}>Annuler le point</button>
			</div>
		{:else}
			<div class="flex flex-wrap items-center gap-2">
				<p class="mr-2 text-2xl font-extrabold">{formatValue(value, kind)}</p>
				<button type="button" class="btn-secondary" disabled={points.length === 0} on:click={undo}>Annuler le point</button>
				<button type="button" class="btn-secondary" on:click={reset}>Recommencer</button>
				<button type="button" class="btn-primary" disabled={points.length < minPoints} on:click={finish}>Utiliser cette mesure</button>
			</div>
			<p class="text-xs text-ink-secondary dark:text-ink-dark-secondary">
				Précision limitée : fiable seulement pour ce qui se trouve dans le même plan que l’objet de référence et photographié de face.
			</p>
		{/if}
	{/if}
</div>
