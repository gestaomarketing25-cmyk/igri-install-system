create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('technician','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique,
  client_name text not null,
  phone text,
  address text not null,
  plan text not null,
  attendant_name text,
  property_type text,
  bedrooms text,
  environments jsonb not null default '[]'::jsonb,
  devices jsonb not null default '[]'::jsonb,
  priorities jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  concurrent_users text,
  router_preference text,
  cabling jsonb not null default '[]'::jsonb,
  cable_difficulty jsonb not null default '[]'::jsonb,
  iptv jsonb not null default '{}'::jsonb,
  observations text,
  internal_notes text,
  ai_recommendation jsonb not null default '{}'::jsonb,
  ai_source text not null default 'rules',
  status text not null default 'pending' check (status in ('pending','assigned','in_progress','completed')),
  assigned_technician uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installations (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null unique references public.briefings(id) on delete cascade,
  technician_id uuid not null references public.profiles(id),
  checklist jsonb not null default '{}'::jsonb,
  router_actual_location text,
  router_height text,
  technician_notes text,
  deviations text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.installation_photos (
  id uuid primary key default gen_random_uuid(),
  installation_id uuid not null references public.installations(id) on delete cascade,
  kind text not null check (kind in ('router','device','other')),
  device_name text,
  room text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists briefings_status_idx on public.briefings(status);
create index if not exists briefings_technician_idx on public.briefings(assigned_technician);
create index if not exists briefings_created_idx on public.briefings(created_at desc);

alter table public.profiles enable row level security;
alter table public.briefings enable row level security;
alter table public.installations enable row level security;
alter table public.installation_photos enable row level security;

-- O aplicativo usa rotas de servidor com SERVICE_ROLE para dados operacionais.
-- O acesso direto do navegador às tabelas permanece bloqueado por RLS.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('installation-photos','installation-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public;
