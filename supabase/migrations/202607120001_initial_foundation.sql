create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  marketing_consent boolean not null default false,
  ai_context_consent boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.birth_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  birth_date date not null,
  birth_time time,
  birth_time_certainty text not null check (birth_time_certainty in ('official_recorded', 'family_reported', 'approximate', 'rectified', 'unknown')),
  location_label text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  iana_time_zone text,
  historical_utc_offset_minutes integer,
  dst_status text not null default 'unknown',
  ambiguity_status text not null default 'unknown_time',
  house_system text not null default 'placidus',
  zodiac_mode text not null default 'tropical',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chart_snapshots (
  id uuid primary key default gen_random_uuid(),
  birth_profile_id uuid not null references public.birth_profiles(id) on delete cascade,
  provider text not null,
  provider_version text not null,
  resolver_version text not null,
  resolved_utc timestamptz,
  settings jsonb not null default '{}'::jsonb,
  warnings text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.chart_points (
  id uuid primary key default gen_random_uuid(),
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  body text not null,
  sign text not null,
  degree numeric(5, 2) not null,
  retrograde boolean not null default false,
  speed numeric(10, 5)
);

create table public.aspects (
  id uuid primary key default gen_random_uuid(),
  chart_snapshot_id uuid not null references public.chart_snapshots(id) on delete cascade,
  point_a text not null,
  point_b text not null,
  aspect_type text not null,
  orb numeric(5, 2) not null
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  birth_profile_id uuid references public.birth_profiles(id) on delete set null,
  entry_type text not null,
  title text not null,
  body text not null,
  linked_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  first_birth_profile_id uuid not null references public.birth_profiles(id) on delete cascade,
  second_birth_profile_id uuid not null references public.birth_profiles(id) on delete cascade,
  consent_status text not null default 'private',
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan_code text not null,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  review_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  client_profile_id uuid references public.profiles(id) on delete set null,
  email text,
  status text not null default 'invited',
  consent_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  appointment_type text not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table public.session_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  visibility text not null check (visibility in ('practitioner_private', 'client_visible')),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null,
  status text not null default 'draft',
  source_context jsonb not null default '{}'::jsonb,
  share_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.research_projects (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  methodology text not null,
  calculation_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.birth_profiles enable row level security;
alter table public.chart_snapshots enable row level security;
alter table public.chart_points enable row level security;
alter table public.aspects enable row level security;
alter table public.journal_entries enable row level security;
alter table public.relationships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.practitioners enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.session_notes enable row level security;
alter table public.reports enable row level security;
alter table public.courses enable row level security;
alter table public.research_projects enable row level security;

create policy "profiles own rows" on public.profiles
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

create policy "birth profiles owner rows" on public.birth_profiles
  for all using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "journal owner rows" on public.journal_entries
  for all using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "reports owner rows" on public.reports
  for all using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "research owner rows" on public.research_projects
  for all using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
