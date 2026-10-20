import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
export async function GET(req:Request){
 const auth=await requireUser(req,['admin']); if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
 const sb=supabaseAdmin(); const statuses=['pending','assigned','in_progress','completed']; const counts:any={};
 for(const s of statuses){const {count}=await sb.from('briefings').select('*',{count:'exact',head:true}).eq('status',s);counts[s]=count||0;}
 return NextResponse.json({counts});
}
