import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
 if (!locals.user) return json({ error: 'Authentification requise' }, { status: 401 });
 const q=url.searchParams.get('q')?.trim()??'';
 let query=locals.supabase.from('fournisseurs').select('*').order('favorite',{ascending:false}).order('name');
 if(q) query=query.ilike('name',`%${q}%`);
 const {data,error}=await query; if(error)return json({error:'Impossible de charger les fournisseurs.'},{status:500}); return json({fournisseurs:data??[]});
};
export const POST: RequestHandler = async ({ locals, request }) => {
 if(!locals.user)return json({error:'Authentification requise'},{status:401}); const b=await request.json().catch(()=>null); const name=typeof b?.name==='string'?b.name.trim():''; if(!name)return json({error:'Le nom est requis.'},{status:400});
 const {data,error}=await locals.supabase.from('fournisseurs').insert({name,email:b.email?.trim()||null,phone:b.phone?.trim()||null,address:b.address?.trim()||null,favorite:!!b.favorite,notes:b.notes?.trim()||null,user_id:locals.user.id}).select().single(); if(error)return json({error:'Création impossible.'},{status:500}); return json({fournisseur:data},{status:201});
};
export const PATCH: RequestHandler = async ({ locals, request }) => {
 if(!locals.user)return json({error:'Authentification requise'},{status:401}); const b=await request.json().catch(()=>null); if(!b?.id)return json({error:'Identifiant requis.'},{status:400});
 const update={name:typeof b.name==='string'?b.name.trim():undefined,email:b.email?.trim()||null,phone:b.phone?.trim()||null,address:b.address?.trim()||null,favorite:!!b.favorite,notes:b.notes?.trim()||null}; const {data,error}=await locals.supabase.from('fournisseurs').update(update).eq('id',b.id).select().single(); if(error)return json({error:'Modification impossible.'},{status:500}); return json({fournisseur:data});
};
export const DELETE: RequestHandler = async ({ locals, request }) => { if(!locals.user)return json({error:'Authentification requise'},{status:401}); const b=await request.json().catch(()=>null); const {error}=await locals.supabase.from('fournisseurs').delete().eq('id',b?.id); if(error)return json({error:'Suppression impossible.'},{status:500}); return new Response(null,{status:204}); };
