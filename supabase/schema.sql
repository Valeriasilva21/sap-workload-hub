-- SAP Workload & Integration Hub — esquema PostgreSQL / Supabase
-- Refleja 1:1 el modelo del front (camelCase ↔ snake_case).

create extension if not exists pgcrypto;

create table public.members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  capacity    numeric(5,1) not null default 40 check (capacity > 0),
  color       text,
  active      boolean not null default true,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.projects (
  id         uuid primary key default gen_random_uuid(),
  code       text,
  name       text not null,
  color      text,
  created_at timestamptz not null default now()
);

create type public.integration_stage as enum ('backlog', 'design', 'build', 'test', 'deploy');

create table public.integrations (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  name          text not null,
  systems       text,
  technology    text not null check (technology in ('CPI', 'PO', 'API', 'IDoc', 'ABAP')),
  stage         public.integration_stage not null default 'backlog',
  owner_id      uuid references public.members (id) on delete set null,
  progress      smallint not null default 0 check (progress between 0 and 100),
  due_date      date,
  blocked       boolean not null default false,
  block_reason  text,
  blocked_since date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint blocked_has_since check (not blocked or blocked_since is not null)
);

create index integrations_project_id_idx on public.integrations (project_id);
create index integrations_owner_id_idx on public.integrations (owner_id);
create index integrations_blocked_idx on public.integrations (blocked) where blocked;

-- Asignación semanal: horas de un integrante en una interfaz para una semana (lunes).
create table public.allocations (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.members (id) on delete cascade,
  integration_id uuid not null references public.integrations (id) on delete cascade,
  week_start     date not null check (extract(isodow from week_start) = 1),
  hours          numeric(5,1) not null check (hours >= 0),
  created_at     timestamptz not null default now(),
  unique (member_id, integration_id, week_start)
);

create index allocations_week_member_idx on public.allocations (week_start, member_id);
create index allocations_integration_id_idx on public.allocations (integration_id);

-- Cargabilidad semanal por integrante (equivale a selectors.memberLoad)
create view public.member_week_load with (security_invoker = true) as
select m.id as member_id,
       a.week_start,
       sum(a.hours)                                       as hours,
       m.capacity,
       round(sum(a.hours) / m.capacity * 100)             as pct,
       case when sum(a.hours) / m.capacity > 1    then 'over'
            when sum(a.hours) / m.capacity >= 0.85 then 'optimal'
            else 'available' end                          as status
from public.members m
join public.allocations a on a.member_id = m.id
group by m.id, a.week_start, m.capacity;

-- Mantiene updated_at y blocked_since
create or replace function public.integrations_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.blocked and new.blocked_since is null then
    new.blocked_since := current_date;
  elsif not new.blocked then
    new.blocked_since := null;
    new.block_reason := null;
  end if;
  return new;
end $$;

create trigger integrations_before_write
before insert or update on public.integrations
for each row execute function public.integrations_before_write();

-- Seguridad: activar RLS y abrir lectura/escritura a usuarios autenticados del equipo.
-- Ajusta las políticas (p. ej. solo el propio integrante edita sus allocations).
alter table public.members      enable row level security;
alter table public.projects     enable row level security;
alter table public.integrations enable row level security;
alter table public.allocations  enable row level security;

create policy "team read members"      on public.members      for select to authenticated using (true);
create policy "team read projects"     on public.projects     for select to authenticated using (true);
create policy "team write projects"    on public.projects     for insert to authenticated with check (true);
create policy "team all integrations"  on public.integrations for all    to authenticated using (true) with check (true);
create policy "team read allocations"  on public.allocations  for select to authenticated using (true);
create policy "own allocations write"  on public.allocations  for all    to authenticated
  using      (member_id in (select id from public.members where auth_user_id = (select auth.uid())))
  with check (member_id in (select id from public.members where auth_user_id = (select auth.uid())));
