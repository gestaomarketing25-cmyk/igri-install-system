import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req:Request){
  const auth=await requireUser(req,['admin']);
  if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const {data,error}=await supabaseAdmin()
    .from('profiles')
    .select('id,username,display_name,active')
    .eq('role','technician')
    .order('display_name');
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({technicians:data});
}

export async function POST(req:Request){
  const auth=await requireUser(req,['admin']);
  if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const body=await req.json();
  const username=String(body.username||'').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'');
  const displayName=String(body.display_name||'').trim();
  const password=String(body.password||'');
  if(!username||!displayName||password.length<8){
    return NextResponse.json({error:'Informe nome, usuário e uma senha com pelo menos 8 caracteres.'},{status:400});
  }
  const sb=supabaseAdmin();
  const email=`${username}@igritelecom.com.br`;
  const {data:created,error:createError}=await sb.auth.admin.createUser({
    email,password,email_confirm:true,
    user_metadata:{username,display_name:displayName,app_role:'technician'}
  });
  if(createError)return NextResponse.json({error:createError.message},{status:400});
  const {error:profileError}=await sb.from('profiles').upsert({
    id:created.user.id,username,display_name:displayName,role:'technician',active:true
  });
  if(profileError){
    await sb.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({error:profileError.message},{status:500});
  }
  return NextResponse.json({technician:{id:created.user.id,username,display_name:displayName,active:true}});
}

export async function DELETE(req:Request){
  const auth=await requireUser(req,['admin']);
  if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await req.json();
  if(!id)return NextResponse.json({error:'Técnico não informado.'},{status:400});
  const sb=supabaseAdmin();
  const {data:profile,error:pErr}=await sb.from('profiles').select('id,role').eq('id',id).single();
  if(pErr||!profile||profile.role!=='technician')return NextResponse.json({error:'Técnico não encontrado.'},{status:404});
  const {error}=await sb.from('profiles').update({active:false}).eq('id',id);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const {error:authError}=await sb.auth.admin.updateUserById(id,{ban_duration:'876000h'});
  if(authError)return NextResponse.json({error:authError.message},{status:500});
  return NextResponse.json({ok:true});
}
