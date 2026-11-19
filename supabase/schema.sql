-- novaFlow (by Weinnova) · SAP Integration & Workload Hub — esquema para Supabase (PostgreSQL)
--
-- Cómo usarlo: Supabase → SQL Editor → pegar este archivo completo → Run.
-- Se puede volver a ejecutar sin romper nada (usa "if not exists" / "drop ... if exists").
--
-- Modelo de acceso elegido: ABIERTO, sin login.
--   Cualquiera que abra la app puede ver y modificar todos los datos.
--   La clave publicable de Supabase va dentro de la página pública, así que
--   estas políticas son lo único que controla el acceso.
--   Para cerrarlo más adelante: activar Supabase Auth y cambiar las políticas
--   "open_*" de abajo por políticas "to authenticated" (ver README).
--
-- Los IDs son texto generado por la app (p. ej. "m_3f9a1c2b7d"), para que la
-- interfaz responda al instante y la escritura en la base ocurra en segundo plano.

-- ─── Tablas ─────────────────────────────────────────────────────────────────

create table if not exists public.members (
  id         text primary key default gen_random_uuid()::text,
  name       text not null check (length(trim(name)) between 2 and 60),
  role       text not null default '',
  level      text not null default '' check (level in ('', 'junior', 'semisenior', 'senior', 'lead', 'architect')),
  capacity   numeric(4,1) not null default 40 check (capacity > 0 and capacity <= 60),
  color      text not null default 'blue',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id         text primary key default gen_random_uuid()::text,
  code       text not null default '',
  name       text not null check (length(trim(name)) > 0),
  color      text not null default 'blue',
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id            text primary key default gen_random_uuid()::text,
  project_id    text not null references public.projects (id) on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  systems       text not null default '',
  technology    text not null check (technology in ('CPI', 'PO', 'API', 'IDoc', 'ABAP')),
  stage         text not null default 'backlog' check (stage in ('backlog', 'design', 'build', 'test', 'deploy', 'changes')),
  owner_id      text references public.members (id) on delete set null,
  progress      smallint not null default 0 check (progress between 0 and 100),
  due_date      date,
  blocked       boolean not null default false,
  block_reason  text not null default '',
  blocked_since date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Horas de un integrante en una interfaz durante una semana (week_start = lunes)
create table if not exists public.allocations (
  id             text primary key default gen_random_uuid()::text,
  member_id      text not null references public.members (id) on delete cascade,
  integration_id text not null references public.integrations (id) on delete cascade,
  week_start     date not null check (extract(isodow from week_start) = 1),
  hours          numeric(4,1) not null check (hours >= 0 and hours <= 80),
  created_at     timestamptz not null default now(),
  unique (member_id, integration_id, week_start)
);

-- Comentarios del equipo sobre una interfaz (member_id = autor)
create table if not exists public.comments (
  id             text primary key default gen_random_uuid()::text,
  integration_id text not null references public.integrations (id) on delete cascade,
  member_id      text references public.members (id) on delete set null,
  body           text not null check (length(trim(body)) between 1 and 5000),
  created_at     timestamptz not null default now()
);

-- Cambios para bases creadas con una versión anterior de este archivo
alter table public.members add column if not exists level text not null default ''
  check (level in ('', 'junior', 'semisenior', 'senior', 'lead', 'architect'));
alter table public.comments drop constraint if exists comments_body_check;
alter table public.comments add constraint comments_body_check
  check (length(trim(body)) between 1 and 5000);
alter table public.integrations drop constraint if exists integrations_stage_check;
alter table public.integrations add constraint integrations_stage_check
  check (stage in ('backlog', 'design', 'build', 'test', 'deploy', 'changes'));

-- Índices para las llaves foráneas y la consulta por semana
create index if not exists integrations_project_id_idx on public.integrations (project_id);
create index if not exists integrations_owner_id_idx   on public.integrations (owner_id);
create index if not exists allocations_integration_idx on public.allocations (integration_id);
create index if not exists allocations_week_member_idx on public.allocations (week_start, member_id);
create index if not exists comments_integration_idx    on public.comments (integration_id, created_at);
create index if not exists comments_member_idx         on public.comments (member_id);

-- ─── Acceso (Data API) ──────────────────────────────────────────────────────
-- Solo estas 5 tablas y solo las operaciones que usa la app.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete
  on public.members, public.projects, public.integrations, public.allocations, public.comments
  to anon, authenticated;

alter table public.members      enable row level security;
alter table public.projects     enable row level security;
alter table public.integrations enable row level security;
alter table public.allocations  enable row level security;
alter table public.comments     enable row level security;

-- Políticas abiertas (modelo elegido: sin login). Una por operación y tabla.
do $$
declare
  t text;
begin
  foreach t in array array['members', 'projects', 'integrations', 'allocations', 'comments'] loop
    execute format('drop policy if exists "open_select" on public.%I', t);
    execute format('drop policy if exists "open_insert" on public.%I', t);
    execute format('drop policy if exists "open_update" on public.%I', t);
    execute format('drop policy if exists "open_delete" on public.%I', t);
    execute format('create policy "open_select" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "open_insert" on public.%I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "open_update" on public.%I for update to anon, authenticated using (true) with check (true)', t);
    execute format('create policy "open_delete" on public.%I for delete to anon, authenticated using (true)', t);
  end loop;
end $$;

-- ─── Tiempo real ────────────────────────────────────────────────────────────
-- Los cambios de cualquier persona aparecen al instante en las demás pantallas.

do $$
declare
  t text;
begin
  foreach t in array array['members', 'projects', 'integrations', 'allocations', 'comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
