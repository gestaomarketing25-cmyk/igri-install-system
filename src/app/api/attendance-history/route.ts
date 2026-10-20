import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function allowed(req:Request){
  return req.headers.get('x-attendance-token') === process.env.ATENDIMENTO_ACCESS_TOKEN;
}

export async function GET(req:Request){
  if(!allowed(req)) return NextResponse.json({error:'Acesso negado.'},{status:403});
  const sb=supabaseAdmin();
  const {data,error}=await sb.from('briefings')
    .select('id,protocol,client_name,phone,address,plan,attendant_name,status,created_at,updated_at,assigned_technician,profiles:assigned_technician(display_name),installations(completed_at,router_actual_location,technician_notes)')
    .order('created_at',{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({briefings:data});
}
