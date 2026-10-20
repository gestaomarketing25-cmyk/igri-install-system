import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

const users = [
  ['wanderson', 'Wanderson', 'technician', process.env.SEED_WANDERSON_PASSWORD],
  ['eribaldo', 'Eribaldo', 'technician', process.env.SEED_ERIBALDO_PASSWORD],
  ['gabriel', 'Gabriel', 'technician', process.env.SEED_GABRIEL_PASSWORD],
  ['carlos', 'Carlos', 'technician', process.env.SEED_CARLOS_PASSWORD],
  ['admin', 'Administrador', 'admin', process.env.SEED_ADMIN_PASSWORD],
];

for (const [username, displayName, role, password] of users) {
  if (!password) throw new Error(`Senha ausente para ${username}.`);

  const email = `${username}@igritelecom.com.br`;
  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
        app_role: role
      }
    }
  });

  if (error) {
    const msg = String(error.message || '');
    if (!/already|registered|exists/i.test(msg)) throw error;
    console.log(`Já existente: ${username}`);
  } else if (data.user) {
    console.log(`Criado: ${username}`);
  }
}

console.log('Seed concluído.');
