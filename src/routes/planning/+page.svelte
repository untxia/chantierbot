<script lang="ts">
	import { onMount } from 'svelte';

	export let data;
	type View = 'month' | 'week';
	let view: View = 'month';
	let cursor = new Date();
	let modalOpen = false;
	let editingId: string | null = null;
	let saving = false;
	let message = '';
	let selectedDay = '';
	let form = { title: '', description: '', type: 'intervention', start_at: '', end_at: '', chantier_id: '', client_id: '' };

	const typeLabels: Record<string, string> = { client: 'Client', intervention: 'Intervention', livraison: 'Livraison', reunion: 'Réunion', autre: 'Autre' };
	const pad = (n: number) => String(n).padStart(2, '0');
	const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	const fmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });
	const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
	const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
	const parse = (v: string) => new Date(v);

	$: monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
	$: monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
	$: monthDays = Array.from({ length: monthEnd.getDate() }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1));
	$: monthLeading = (monthStart.getDay() + 6) % 7;
	$: monthCells = [...Array(monthLeading).fill(null), ...monthDays];
	$: weekStart = (() => { const d = new Date(cursor); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0,0,0,0); return d; })();
	$: weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
	$: visibleStart = view === 'month' ? monthStart : weekStart;
	$: visibleEnd = view === 'month' ? monthEnd : new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
	$: events = data.rendezVous.filter((r: any) => { const d = parse(r.start_at); return d >= new Date(visibleStart.getFullYear(), visibleStart.getMonth(), visibleStart.getDate()) && d < new Date(visibleEnd.getFullYear(), visibleEnd.getMonth(), visibleEnd.getDate() + 1); });

	function eventsFor(day: Date) { const key = isoDay(day); return events.filter((r: any) => isoDay(parse(r.start_at)) === key); }
	function chantierEvents(day: Date) { const key = isoDay(day); return data.chantiers.filter((c: any) => c.start_date && c.end_date && key >= c.start_date && key <= c.end_date); }
	function shift(delta: number) { const d = new Date(cursor); if (view === 'month') d.setMonth(d.getMonth() + delta); else d.setDate(d.getDate() + delta * 7); cursor = d; }
	function today() { cursor = new Date(); }
	function openCreate(day?: Date) {
		editingId = null; message = ''; selectedDay = day ? isoDay(day) : isoDay(new Date());
		form = { title: '', description: '', type: 'intervention', start_at: `${selectedDay}T09:00`, end_at: `${selectedDay}T10:00`, chantier_id: '', client_id: '' }; modalOpen = true;
	}
	function openEdit(r: any) {
		editingId = r.id; message = ''; form = { title: r.title, description: r.description ?? '', type: r.type, start_at: r.start_at.slice(0,16), end_at: r.end_at.slice(0,16), chantier_id: r.chantier_id ?? '', client_id: r.client_id ?? '' }; modalOpen = true;
	}
	async function save() {
		saving = true; message = '';
		const response = await fetch('/api/planning', { method: editingId ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(editingId ? { id: editingId, ...form } : form) });
		if (!response.ok) { const body = await response.json().catch(() => ({})); message = body.error ?? 'Une erreur est survenue'; saving = false; return; }
		location.reload();
	}
	async function remove() {
		if (!editingId || !confirm('Supprimer ce rendez-vous ?')) return;
		await fetch('/api/planning', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: editingId }) });
		location.reload();
	}
	function chantierName(id: string) { return data.chantiers.find((c: any) => c.id === id)?.name; }
	onMount(() => {});
</script>

<svelte:head><title>ChantierBot — Planning</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div><p class="text-sm font-semibold text-brand-blue">ORGANISATION</p><h1 class="text-3xl font-extrabold tracking-tight">Planning</h1><p class="mt-1 text-ink-secondary dark:text-ink-dark-secondary">Vos rendez-vous et vos chantiers, au même endroit.</p></div>
		<button class="rounded-xl bg-brand-blue px-5 py-3 font-bold text-white shadow-lg shadow-brand-blue/20 transition hover:-translate-y-0.5" on:click={() => openCreate()}>＋ Nouveau rendez-vous</button>
	</div>

	<div class="card overflow-hidden p-0">
		<div class="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-2"><button class="rounded-lg border px-3 py-2 text-sm" on:click={() => shift(-1)}>←</button><button class="rounded-lg border px-3 py-2 text-sm font-semibold" on:click={today}>Aujourd'hui</button><button class="rounded-lg border px-3 py-2 text-sm" on:click={() => shift(1)}>→</button><h2 class="ml-2 text-lg font-bold capitalize">{view === 'month' ? monthFmt.format(cursor) : `${fmt.format(weekStart)} — ${fmt.format(weekDays[6])}`}</h2></div>
			<div class="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800"><button class:active-tab={view === 'month'} class="rounded-md px-4 py-2 text-sm font-semibold" on:click={() => view='month'}>Mois</button><button class:active-tab={view === 'week'} class="rounded-md px-4 py-2 text-sm font-semibold" on:click={() => view='week'}>Semaine</button></div>
		</div>

		{#if view === 'month'}
			<div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900/50"><div class="p-3">Lun</div><div class="p-3">Mar</div><div class="p-3">Mer</div><div class="p-3">Jeu</div><div class="p-3">Ven</div><div class="p-3">Sam</div><div class="p-3">Dim</div></div>
			<div class="grid grid-cols-7">{#each monthCells as day, i}<div class="min-h-32 border-b border-r border-slate-200 p-2 dark:border-slate-700" class:today-cell={day && isoDay(day) === isoDay(new Date())}>{#if day}<button class="mb-2 text-xs font-bold" on:click={() => openCreate(day)}>{day.getDate()}</button>{#each eventsFor(day) as r}<button class="mb-1 block w-full truncate rounded-lg bg-brand-blue px-2 py-1 text-left text-xs font-semibold text-white" on:click={() => openEdit(r)}>{timeFmt.format(parse(r.start_at))} · {r.title}</button>{/each}{#each chantierEvents(day).slice(0,2) as c}<a class="mb-1 block truncate rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300" href={`/chantiers/${c.id}`}>🏗 {c.name} · {c.progress ?? 0}%</a>{/each}{/if}</div>{/each}</div>
		{:else}
			<div class="grid grid-cols-7">{#each weekDays as day}<div class="min-h-[430px] border-r border-slate-200 p-2 dark:border-slate-700"><div class="mb-3 text-center"><div class="text-xs uppercase text-slate-500">{new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(day)}</div><div class="mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full font-bold" class:bg-brand-blue={isoDay(day)===isoDay(new Date())} class:text-white={isoDay(day)===isoDay(new Date())}>{day.getDate()}</div></div>{#each eventsFor(day) as r}<button class="mb-2 block w-full rounded-xl bg-brand-blue p-3 text-left text-xs text-white shadow-sm" on:click={() => openEdit(r)}><strong>{timeFmt.format(parse(r.start_at))}</strong><div class="mt-1 font-bold">{r.title}</div><div class="mt-1 opacity-80">{typeLabels[r.type]}{r.chantier_id ? ` · ${chantierName(r.chantier_id)}` : ''}</div></button>{/each}{#each chantierEvents(day) as c}<a class="mb-2 block rounded-xl bg-violet-50 p-3 text-xs dark:bg-violet-950/30" href={`/chantiers/${c.id}`}><div class="font-bold text-violet-700 dark:text-violet-300">🏗 {c.name}</div><div class="mt-1 text-slate-500">Avancement {c.progress ?? 0}%</div></a>{/each}<button class="mt-2 w-full rounded-lg border border-dashed p-2 text-xs text-slate-500 hover:border-brand-blue hover:text-brand-blue" on:click={() => openCreate(day)}>＋ Ajouter</button></div>{/each}</div>
		{/if}
	</div>

	<div class="grid gap-4 md:grid-cols-3"><div class="card"><p class="text-xs font-bold uppercase text-slate-500">Cette période</p><p class="mt-2 text-3xl font-extrabold">{events.length}</p><p class="text-sm text-slate-500">rendez-vous</p></div><div class="card"><p class="text-xs font-bold uppercase text-slate-500">Chantiers planifiés</p><p class="mt-2 text-3xl font-extrabold">{data.chantiers.filter((c:any) => c.start_date && c.end_date).length}</p><p class="text-sm text-slate-500">avec dates définies</p></div><div class="card bg-gradient-to-br from-brand-blue to-brand-violet text-white"><p class="text-xs font-bold uppercase opacity-80">Assistant IA</p><p class="mt-2 font-bold">Bientôt : “Que dois-je faire demain ?” 🤖</p><p class="mt-1 text-sm opacity-80">Le planning pourra être interrogé naturellement.</p></div></div>
</div>

{#if modalOpen}<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" on:click={(e) => e.target === e.currentTarget && (modalOpen=false)}><div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div class="flex items-center justify-between"><div><p class="text-sm font-semibold text-brand-blue">{editingId ? 'MODIFIER' : 'NOUVEAU'}</p><h2 class="text-2xl font-extrabold">Rendez-vous</h2></div><button class="text-2xl text-slate-400" on:click={() => modalOpen=false}>×</button></div><div class="mt-5 grid gap-4 md:grid-cols-2"><label class="md:col-span-2"><span class="label">Titre</span><input class="input" bind:value={form.title} placeholder="Ex. Visite client" /></label><label><span class="label">Type</span><select class="input" bind:value={form.type}>{#each Object.entries(typeLabels) as [value,label]}<option {value}>{label}</option>{/each}</select></label><label><span class="label">Chantier</span><select class="input" bind:value={form.chantier_id}><option value="">Aucun</option>{#each data.chantiers as c}<option value={c.id}>{c.name}</option>{/each}</select></label><label><span class="label">Client</span><select class="input" bind:value={form.client_id}><option value="">Aucun</option>{#each data.clients as c}<option value={c.id}>{c.name}</option>{/each}</select></label><label><span class="label">Début</span><input class="input" type="datetime-local" bind:value={form.start_at} /></label><label><span class="label">Fin</span><input class="input" type="datetime-local" bind:value={form.end_at} /></label><label class="md:col-span-2"><span class="label">Description</span><textarea class="input min-h-24" bind:value={form.description} placeholder="Notes, adresse, informations utiles…"></textarea></label></div>{#if message}<p class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>{/if}<div class="mt-6 flex justify-between gap-3"><div>{#if editingId}<button class="rounded-xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50" on:click={remove}>Supprimer</button>{/if}</div><div class="flex gap-3"><button class="rounded-xl border px-4 py-3 font-semibold" on:click={() => modalOpen=false}>Annuler</button><button class="rounded-xl bg-brand-blue px-5 py-3 font-bold text-white disabled:opacity-50" disabled={saving} on:click={save}>{saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Créer le rendez-vous'}</button></div></div></div></div>{/if}

<style>
	.today-cell { background: rgba(88, 101, 242, 0.05); }
	.active-tab { background: white; box-shadow: 0 1px 3px rgb(15 23 42 / 0.12); }
	:global(.dark) .active-tab { background: #111827; }
	.label { display:block; margin-bottom:.4rem; font-size:.8rem; font-weight:700; color:#64748b; }
	.input { width:100%; border:1px solid #e2e8f0; border-radius:.75rem; padding:.7rem .8rem; background:inherit; outline:none; }
	.input:focus { border-color:#5865F2; box-shadow:0 0 0 3px rgb(88 101 242 / .12); }
	:global(.dark) .input { border-color:#334155; background:#0f172a; }
</style>
