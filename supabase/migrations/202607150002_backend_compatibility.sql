alter table public.chart_points
  add column if not exists minute integer,
  add column if not exists longitude_decimal numeric(8, 4),
  add column if not exists house integer,
  add column if not exists is_retrograde boolean,
  add column if not exists raw jsonb not null default '{}'::jsonb;

update public.chart_points
set is_retrograde = retrograde
where is_retrograde is null;

alter table public.reports
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists generated_at timestamptz not null default now();

create table if not exists public.workspace_states (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspace_states_owner_profile_id_key
  on public.workspace_states(owner_profile_id);

alter table public.workspace_states enable row level security;

drop policy if exists "workspace state owner rows" on public.workspace_states;

create policy "workspace state owner rows" on public.workspace_states
  for all using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
