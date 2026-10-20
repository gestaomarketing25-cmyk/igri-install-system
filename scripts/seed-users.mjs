import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');

const supabase = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

const users = [
  ['wanderson', 'Wanderson', 'technician', process.env.SEED_WANDERSON_PASSWORD],
  ['eribaldo', 'Eribaldo', 'technician', process.env.SEED_ERIBALDO_PASSWORD],
  ['gabriel', 'Gabriel', 'technician', process.env.SEED_GABRIEL_PASSWORD],
  ['carlos', 'Carlos', 'technician', process.env.SEED_CARLOS_PASSWORD],
  ['admin', 'Administrador', 'admin', process.env.SEED_ADMIN_PASSWORD],
];

for (const [username, displayName, role, password] of users) {
  if (!password) throw new Error(`Senha ausente para ${username}.`);
  const email = `${username}@users.igri.local`;
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  let user = list.users.find(u => u.email === email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
    console.log(`Criado: ${username}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (error) throw error;
    console.log(`Atualizado: ${username}`);
  }
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id, username, display_name: displayName, role, active: true
  });
  if (profileError) throw profileError;
}
console.log('Usuários iniciais prontos.');
