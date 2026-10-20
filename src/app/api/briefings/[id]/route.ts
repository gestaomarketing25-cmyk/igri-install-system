import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request, { params }: { params: Promise<{id:string}> }) {
  const auth = await requireUser(req, ['admin','technician']);
  if ('error' in auth) return NextResponse.json({error:auth.error},{status:auth.status});
  const { id } = await params;
  const sb = supabaseAdmin();
  let q = sb.from('briefings').select('*, profiles:assigned_technician(id,display_name,username), installations(*, installation_photos(*))').eq('id',id);
  if (auth.profile.role === 'technician') q = q.eq('assigned_technician', auth.profile.id);
  const { data, error } = await q.single();
  if (error) return NextResponse.json({error:'Ordem não encontrada.'},{status:404});
  if (data.installations?.installation_photos) {
    for (const p of data.installations.installation_photos) {
      const { data:signed } = await sb.storage.from('installation-photos').createSignedUrl(p.storage_path, 3600);
      p.url = signed?.signedUrl;
    }
  }
  return NextResponse.json({ briefing:data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{id:string}> }) {
  const auth = await requireUser(req, ['admin']);
  if ('error' in auth) return NextResponse.json({error:auth.error},{status:auth.status});
  const { id } = await params; const body = await req.json();
  const allowed:any = {};
  if ('assigned_technician' in body) { allowed.assigned_technician = body.assigned_technician || null; allowed.status = body.assigned_technician ? 'assigned':'pending'; }
  const sb=supabaseAdmin();
  const {data,error}=await sb.from('briefings').update({...allowed,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({briefing:data});
}
