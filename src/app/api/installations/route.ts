import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req:Request){
  const auth=await requireUser(req,['technician']);
  if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const body=await req.json(); const sb=supabaseAdmin();
  const {data:briefing,error:bErr}=await sb.from('briefings').select('*').eq('id',body.briefing_id).eq('assigned_technician',auth.profile.id).single();
  if(bErr||!briefing)return NextResponse.json({error:'Ordem não encontrada ou não atribuída a você.'},{status:404});
  const {data:existing}=await sb.from('installations').select('*').eq('briefing_id',body.briefing_id).maybeSingle();
  if(existing)return NextResponse.json({installation:existing});
  const {data,error}=await sb.from('installations').insert({briefing_id:body.briefing_id,technician_id:auth.profile.id}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  await sb.from('briefings').update({status:'in_progress',updated_at:new Date().toISOString()}).eq('id',body.briefing_id);
  return NextResponse.json({installation:data});
}

export async function PATCH(req:Request){
  const auth=await requireUser(req,['technician']);
  if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const body=await req.json(); const sb=supabaseAdmin();
  const {data:installation,error:iErr}=await sb.from('installations').select('*, briefings(*)').eq('id',body.installation_id).eq('technician_id',auth.profile.id).single();
  if(iErr||!installation)return NextResponse.json({error:'Instalação não encontrada.'},{status:404});
  const required=body.checklist||{};
  const missing=Object.entries(required).filter(([_,v])=>v!==true).map(([k])=>k);
  if(body.complete && missing.length)return NextResponse.json({error:'Conclua todos os itens obrigatórios do checklist.',missing},{status:400});
  if(body.complete){
    const {data:photos}=await sb.from('installation_photos').select('*').eq('installation_id',body.installation_id);
    const routerPhoto=photos?.some(p=>p.kind==='router');
    const expected=(installation.briefings.cabling||[]) as Array<{device:string,room:string}>;
    const devicePhotos=photos?.filter(p=>p.kind==='device')||[];
    if(!routerPhoto)return NextResponse.json({error:'A foto do modem/roteador instalado é obrigatória.'},{status:400});
    const missingDevices=expected.filter(x=>!devicePhotos.some(p=>p.device_name===x.device));
    if(missingDevices.length)return NextResponse.json({error:'Faltam fotos dos equipamentos cabeados.',missingDevices},{status:400});
  }
  const update:any={checklist:required,router_actual_location:body.router_actual_location||null,router_height:body.router_height||null,technician_notes:body.technician_notes||null,deviations:body.deviations||null};
  if(body.complete)update.completed_at=new Date().toISOString();
  const {data,error}=await sb.from('installations').update(update).eq('id',body.installation_id).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  if(body.complete)await sb.from('briefings').update({status:'completed',updated_at:new Date().toISOString()}).eq('id',installation.briefing_id);
  return NextResponse.json({installation:data});
}
