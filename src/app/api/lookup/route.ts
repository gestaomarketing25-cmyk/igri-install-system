import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  const { protocol, phone4 } = await req.json();
  if (!protocol || !phone4) return NextResponse.json({error:'Informe protocolo e os 4 últimos dígitos do telefone.'},{status:400});
  const sb=supabaseAdmin();
  const {data,error}=await sb.from('briefings').select('*, profiles:assigned_technician(display_name,username), installations(*, installation_photos(*))').eq('protocol',String(protocol).trim().toUpperCase()).single();
  if(error || !data) return NextResponse.json({error:'Protocolo não encontrado.'},{status:404});
  const digits=String(data.phone||'').replace(/\D/g,'');
  if (!digits.endsWith(String(phone4).replace(/\D/g,''))) return NextResponse.json({error:'Dados de consulta não conferem.'},{status:403});
  if(data.installations?.installation_photos){
    for(const p of data.installations.installation_photos){ const {data:signed}=await sb.storage.from('installation-photos').createSignedUrl(p.storage_path,1800); p.url=signed?.signedUrl; }
  }
  return NextResponse.json({briefing:data});
}
