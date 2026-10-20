import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
export async function GET(req:Request){
 const auth=await requireUser(req,['admin']); if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
 const {data,error}=await supabaseAdmin().from('profiles').select('id,username,display_name').eq('role','technician').eq('active',true).order('display_name');
 if(error)return NextResponse.json({error:error.message},{status:500}); return NextResponse.json({technicians:data});
}
