import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req:Request){
  const auth=await requireUser(req,['technician']);
  if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const fd=await req.formData();
  const installationId=String(fd.get('installation_id')||'');
  const kind=String(fd.get('kind')||'other');
  const deviceName=String(fd.get('device_name')||'');
  const room=String(fd.get('room')||'');
  const file=fd.get('file');
  if(!(file instanceof File)||!installationId)return NextResponse.json({error:'Arquivo inválido.'},{status:400});
  if(file.size>10*1024*1024)return NextResponse.json({error:'A foto deve ter no máximo 10 MB.'},{status:400});
  const sb=supabaseAdmin();
  const {data:inst,error:iErr}=await sb.from('installations').select('*').eq('id',installationId).eq('technician_id',auth.profile.id).single();
  if(iErr||!inst)return NextResponse.json({error:'Instalação não encontrada.'},{status:404});
  const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
  const path=`${inst.briefing_id}/${installationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes=await file.arrayBuffer();
  const {error:upErr}=await sb.storage.from('installation-photos').upload(path,bytes,{contentType:file.type||'image/jpeg',upsert:false});
  if(upErr)return NextResponse.json({error:upErr.message},{status:500});
  const {data,error}=await sb.from('installation_photos').insert({installation_id:installationId,kind,device_name:deviceName||null,room:room||null,storage_path:path}).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:500});
  const {data:signed}=await sb.storage.from('installation-photos').createSignedUrl(path,3600);
  return NextResponse.json({photo:{...data,url:signed?.signedUrl}});
}
