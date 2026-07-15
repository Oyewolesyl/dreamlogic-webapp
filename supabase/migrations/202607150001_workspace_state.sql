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
