import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const statuses = ['brouillon', 'commandee', 'recue', 'annulee'];

async function ownsChantier(supabase: any, userId: string, chantierId: string | null) {
  if (!chantierId) return true;
  const { data } = await supabase.from('chantiers').select('id').eq('id', chantierId).eq('user_id', userId).maybeSingle();
  return !!data;
}

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
  const q = url.searchParams.get('q')?.trim();
  let query = locals.supabase
    .from('commandes')
    .select('*, fournisseurs(id,name,email,phone), chantiers(id,name)')
    .order('order_date', { ascending: false });
  if (q) query = query.ilike('notes', `%${q}%`);
  const { data, error } = await query;
  if (error) return json({ error: error.message }, { status: 500 });

  const orders = data ?? [];
  const ids = orders.map((o: any) => o.id);
  if (!ids.length) return json({ commandes: [] });
  const { data: lines, error: lineError } = await locals.supabase.from('commande_lignes').select('*').in('commande_id', ids).order('id');
  if (lineError) return json({ error: lineError.message }, { status: 500 });
  const byOrder = new Map<string, any[]>();
  for (const line of lines ?? []) byOrder.set(line.commande_id, [...(byOrder.get(line.commande_id) ?? []), line]);
  return json({ commandes: orders.map((o: any) => ({ ...o, lignes: byOrder.get(o.id) ?? [] })) });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
  const userId = locals.user.id;
  const body = await request.json().catch(() => null);
  if (!body?.fournisseur_id) return json({ error: 'Le fournisseur est obligatoire' }, { status: 400 });
  if (!(await ownsChantier(locals.supabase, locals.user.id, body.chantier_id ?? null))) return json({ error: 'Chantier non autorisé' }, { status: 403 });
  const lines = Array.isArray(body.lignes) ? body.lignes : [];
  const cleanLines = lines.filter((l: any) => String(l.designation ?? '').trim()).map((l: any) => {
    const quantity = Number(l.quantity ?? 1);
    const unitPrice = Number(l.unit_price_ht ?? 0);
    return { designation: String(l.designation).trim(), quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1, unit: String(l.unit ?? 'u').trim() || 'u', unit_price_ht: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0 };
  });
  const total = cleanLines.reduce((sum: number, l: any) => sum + l.quantity * l.unit_price_ht, 0);
  const { data: order, error } = await locals.supabase.from('commandes').insert({
    user_id: locals.user.id,
    fournisseur_id: body.fournisseur_id,
    chantier_id: body.chantier_id || null,
    status: statuses.includes(body.status) ? body.status : 'brouillon',
    order_date: body.order_date || new Date().toISOString().slice(0, 10),
    expected_date: body.expected_date || null,
    notes: body.notes || null,
    total_ht: total
  }).select('*').single();
  if (error) return json({ error: error.message }, { status: 500 });
  if (cleanLines.length) {
    const { error: lineError } = await locals.supabase.from('commande_lignes').insert(cleanLines.map((l: any) => ({ ...l, commande_id: order.id, user_id: userId, total_ht: l.quantity * l.unit_price_ht })));
    if (lineError) return json({ error: lineError.message }, { status: 500 });
  }
  return json({ commande: order }, { status: 201 });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
  const userId = locals.user.id;
  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: 'Commande introuvable' }, { status: 400 });
  const { data: existing, error: findError } = await locals.supabase.from('commandes').select('*').eq('id', body.id).single();
  if (findError || !existing) return json({ error: 'Commande introuvable' }, { status: 404 });
  if (!(await ownsChantier(locals.supabase, locals.user.id, body.chantier_id ?? existing.chantier_id ?? null))) return json({ error: 'Chantier non autorisé' }, { status: 403 });
  const lines = Array.isArray(body.lignes) ? body.lignes : [];
  const cleanLines = lines.filter((l: any) => String(l.designation ?? '').trim()).map((l: any) => {
    const quantity = Number(l.quantity ?? 1), unitPrice = Number(l.unit_price_ht ?? 0);
    return { designation: String(l.designation).trim(), quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1, unit: String(l.unit ?? 'u').trim() || 'u', unit_price_ht: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0 };
  });
  const total = cleanLines.reduce((sum: number, l: any) => sum + l.quantity * l.unit_price_ht, 0);
  const { data: order, error } = await locals.supabase.from('commandes').update({
    fournisseur_id: body.fournisseur_id ?? existing.fournisseur_id,
    chantier_id: body.chantier_id ?? existing.chantier_id,
    status: statuses.includes(body.status) ? body.status : existing.status,
    order_date: body.order_date ?? existing.order_date,
    expected_date: body.expected_date || null,
    notes: body.notes ?? existing.notes,
    total_ht: total
  }).eq('id', body.id).select('*').single();
  if (error) return json({ error: error.message }, { status: 500 });
  const { error: deleteError } = await locals.supabase.from('commande_lignes').delete().eq('commande_id', body.id);
  if (deleteError) return json({ error: deleteError.message }, { status: 500 });
  if (cleanLines.length) {
    const { error: lineError } = await locals.supabase.from('commande_lignes').insert(cleanLines.map((l: any) => ({ ...l, commande_id: body.id, user_id: userId, total_ht: l.quantity * l.unit_price_ht })));
    if (lineError) return json({ error: lineError.message }, { status: 500 });
  }
  return json({ commande: order });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  if (!id) return json({ error: 'Commande introuvable' }, { status: 400 });
  const { data: existing } = await locals.supabase.from('commandes').select('id,chantier_id').eq('id', id).maybeSingle();
  if (!existing) return json({ error: 'Commande introuvable' }, { status: 404 });
  if (!(await ownsChantier(locals.supabase, locals.user.id, existing.chantier_id))) return json({ error: 'Commande non autorisée' }, { status: 403 });
  const { error } = await locals.supabase.from('commandes').delete().eq('id', id);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
};
