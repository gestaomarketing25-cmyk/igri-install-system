import { supabaseAdmin } from './supabase-admin';

export async function requireUser(req: Request, roles?: Array<'technician'|'admin'>) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { error: 'Não autenticado', status: 401 } as const;
  const sb = supabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return { error: 'Sessão inválida', status: 401 } as const;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
  if (!profile || !profile.active) return { error: 'Usuário sem acesso', status: 403 } as const;
  if (roles && !roles.includes(profile.role)) return { error: 'Acesso negado', status: 403 } as const;
  return { user: data.user, profile } as const;
}
