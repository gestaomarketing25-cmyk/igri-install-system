import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req:Request){
  if(req.headers.get('x-attendance-token') !== process.env.ATENDIMENTO_ACCESS_TOKEN){
    return NextResponse.json({error:'Acesso negado.'},{status:403});
  }
  const {data,error}=await supabaseAdmin()
    .from('profiles')
    .select('id,display_name')
    .eq('role','technician')
    .eq('active',true)
    .order('display_name');
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({technicians:data});
}
