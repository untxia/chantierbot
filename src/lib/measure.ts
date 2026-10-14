/** Géométrie de mesure : pure, sans dépendance navigateur (testable en Node). */

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

export interface Vec2 {
	x: number;
	y: number;
}

export type Kind = 'longueur' | 'surface';

export function distance3(a: Vec3, b: Vec3): number {
	return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

export function distance2(a: Vec2, b: Vec2): number {
	return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polylineLength3(points: Vec3[]): number {
	let total = 0;
	for (let i = 1; i < points.length; i++) total += distance3(points[i - 1], points[i]);
	return total;
}

export function polylineLength2(points: Vec2[]): number {
	let total = 0;
	for (let i = 1; i < points.length; i++) total += distance2(points[i - 1], points[i]);
	return total;
}

/** Formule du lacet sur des points (a, b) ; polygone implicitement refermé. */
function shoelace(points: { a: number; b: number }[]): number {
	if (points.length < 3) return 0;
	let sum = 0;
	for (let i = 0; i < points.length; i++) {
		const p = points[i];
		const q = points[(i + 1) % points.length];
		sum += p.a * q.b - q.a * p.b;
	}
	return Math.abs(sum) / 2;
}

/** Surface au sol : projection sur le plan horizontal (x, z) — Y est la verticale en WebXR. */
export function polygonAreaXZ(points: Vec3[]): number {
	return shoelace(points.map((p) => ({ a: p.x, b: p.z })));
}

export function polygonArea2(points: Vec2[]): number {
	return shoelace(points.map((p) => ({ a: p.x, b: p.y })));
}

/** Échelle (mètres par pixel) à partir d'une référence connue sur la photo. */
export function metersPerPixel(a: Vec2, b: Vec2, realMeters: number): number | null {
	const px = distance2(a, b);
	if (!(px > 0) || !(realMeters > 0)) return null;
	return realMeters / px;
}

export function formatValue(value: number, kind: Kind): string {
	if (kind === 'surface') return `${value.toFixed(2).replace('.', ',')} m²`;
	return value >= 1 ? `${value.toFixed(2).replace('.', ',')} m` : `${Math.round(value * 100)} cm`;
}

/**
 * Projette un point monde vers l'écran avec les matrices WebXR (colonnes-majeures).
 * Renvoie null si le point est derrière la caméra.
 */
export function projectToScreen(
	viewInverse: ArrayLike<number>,
	projection: ArrayLike<number>,
	p: Vec3,
	width: number,
	height: number
): Vec2 | null {
	const mul = (m: ArrayLike<number>, v: number[]) => [
		m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
		m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
		m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
		m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]
	];
	const view = mul(viewInverse, [p.x, p.y, p.z, 1]);
	const clip = mul(projection, view);
	if (clip[3] <= 0) return null;
	return {
		x: (clip[0] / clip[3] * 0.5 + 0.5) * width,
		y: (1 - (clip[1] / clip[3] * 0.5 + 0.5)) * height
	};
}
