import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(){
  const {data,error}=await supabaseAdmin()
    .from('profiles')
    .select('id,display_name')
    .eq('role','technician')
    .eq('active',true)
    .order('display_name');
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({technicians:data});
}
