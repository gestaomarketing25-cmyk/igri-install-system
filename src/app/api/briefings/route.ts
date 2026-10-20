import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { analyzeBriefing } from '@/lib/analyzer';
import { makeProtocol } from '@/lib/protocol';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.client_name || !body.address || !body.plan) return NextResponse.json({ error: 'Nome, endereço e plano são obrigatórios.' }, { status: 400 });
    const { recommendation, source } = await analyzeBriefing(body);
    const protocol = makeProtocol();
    const sb = supabaseAdmin();
    const initialStatus = body.assigned_technician ? 'assigned' : 'pending';
    const { data, error } = await sb.from('briefings').insert({ ...body, protocol, ai_recommendation: recommendation, ai_source: source, status: initialStatus }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ briefing: data });
  } catch (e:any) { return NextResponse.json({ error: e.message || 'Erro ao salvar briefing.' }, { status: 500 }); }
}

export async function GET(req: Request) {
  const auth = await requireUser(req, ['admin']);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const sb = supabaseAdmin();
  let q = sb.from('briefings').select('*, profiles:assigned_technician(id,display_name,username)').order('created_at',{ascending:false});
  if (status) q = q.eq('status',status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error:error.message },{status:500});
  return NextResponse.json({ briefings:data });
}
