import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
export async function GET(req:Request){
 const auth=await requireUser(req,['technician']); if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
 const {data,error}=await supabaseAdmin().from('briefings').select('*').eq('assigned_technician',auth.profile.id).order('created_at',{ascending:false});
 if(error)return NextResponse.json({error:error.message},{status:500}); return NextResponse.json({tasks:data,profile:auth.profile});
}
