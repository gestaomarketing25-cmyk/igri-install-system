import { supabaseBrowser } from './supabase-browser';
export async function token(){const {data}=await supabaseBrowser().auth.getSession();return data.session?.access_token||''}
export async function api(path:string,init:RequestInit={}){const t=await token();const headers=new Headers(init.headers);if(t)headers.set('Authorization',`Bearer ${t}`);return fetch(path,{...init,headers})}
