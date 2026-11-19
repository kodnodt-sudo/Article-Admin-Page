-- ============================================================================
-- Multi-Company Editorial Admin Panel — Supabase Schema, RLS & Seed Data
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Automatically create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_app_meta_data ->> 'role', 'admin')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function to check whether the current user is an authenticated workspace admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select auth.uid() is not null;
$$;

-- Profiles RLS: users can read their own profile (for role check); admins can read/write all.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. COMPANIES
-- ----------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  domain text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

drop policy if exists "Admins can select companies" on public.companies;
create policy "Admins can select companies"
  on public.companies
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert companies" on public.companies;
create policy "Admins can insert companies"
  on public.companies
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update companies" on public.companies;
create policy "Admins can update companies"
  on public.companies
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete companies" on public.companies;
create policy "Admins can delete companies"
  on public.companies
  for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. ARTICLES
-- ----------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  slug text not null,
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  excerpt text,
  featured_image text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  meta_title text,
  meta_description text,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_company_slug_unique unique (company_id, slug)
);

create index if not exists articles_company_id_idx on public.articles(company_id);
create index if not exists articles_status_idx on public.articles(status);
create index if not exists articles_updated_at_idx on public.articles(updated_at desc);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute procedure public.set_updated_at();

alter table public.articles enable row level security;

drop policy if exists "Admins can select articles" on public.articles;
create policy "Admins can select articles"
  on public.articles
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert articles" on public.articles;
create policy "Admins can insert articles"
  on public.articles
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update articles" on public.articles;
create policy "Admins can update articles"
  on public.articles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete articles" on public.articles;
create policy "Admins can delete articles"
  on public.articles
  for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. STORAGE BUCKET FOR ARTICLE IMAGES
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read article images" on storage.objects;
create policy "Public read article images"
  on storage.objects
  for select
  using (bucket_id = 'article-images');

drop policy if exists "Admins can upload article images" on storage.objects;
create policy "Admins can upload article images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'article-images' and public.is_admin());

drop policy if exists "Admins can update article images" on storage.objects;
create policy "Admins can update article images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'article-images' and public.is_admin())
  with check (bucket_id = 'article-images' and public.is_admin());

drop policy if exists "Admins can delete article images" on storage.objects;
create policy "Admins can delete article images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'article-images' and public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. GRANTS FOR AUTHENTICATED ROLE (RLS ENFORCES ADMIN-ONLY ACCESS)
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.companies, public.articles to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 6. SEED DATA: 7 REALISTIC COMPANIES + SAMPLE ARTICLES
-- ----------------------------------------------------------------------------
insert into public.companies (id, name, slug, domain, logo_url)
values
  ('11111111-1111-4111-8111-111111111101', 'Northstar Freight', 'northstar-freight', 'northstarfreight.com', null),
  ('11111111-1111-4111-8111-111111111102', 'Ledgerline', 'ledgerline', 'ledgerline.io', null),
  ('11111111-1111-4111-8111-111111111103', 'Caldera Health', 'caldera-health', 'calderahealth.org', null),
  ('11111111-1111-4111-8111-111111111104', 'Fieldwork Labs', 'fieldwork-labs', 'fieldworklabs.dev', null),
  ('11111111-1111-4111-8111-111111111105', 'Harborline Energy', 'harborline-energy', 'harborline.energy', null),
  ('11111111-1111-4111-8111-111111111106', 'Kestrel Logistics', 'kestrel-logistics', 'kestrellogistics.co', null),
  ('11111111-1111-4111-8111-111111111107', 'Meridian Cloud', 'meridian-cloud', 'meridiancloud.net', null)
on conflict (slug) do nothing;

insert into public.articles (company_id, title, slug, content, excerpt, status, meta_title, meta_description, published_at, created_at, updated_at)
values
  (
    '11111111-1111-4111-8111-111111111101',
    'Reducing Cold-Chain Dwell Time Across Midwest Hubs',
    'reducing-cold-chain-dwell-time-midwest-hubs',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Cross-docking delays at regional transfer stations account for nearly 38% of temperature excursions in refrigerated LTL lanes. Over the past two quarters, Northstar Freight restructured gate scheduling across Chicago, Columbus, and Minneapolis."}]}]}'::jsonb,
    'How gate-slot telemetry and pre-cleared manifests cut refrigerated transfer dwell time by 24 minutes per load.',
    'published',
    'Reducing Cold-Chain Dwell Time | Northstar Freight',
    'Gate-slot telemetry and pre-cleared manifests cut refrigerated transfer dwell time across Midwest hubs.',
    now() - interval '4 days',
    now() - interval '6 days',
    now() - interval '4 days'
  ),
  (
    '11111111-1111-4111-8111-111111111101',
    'Q4 Intermodal Capacity Outlook: West Coast Ports',
    'q4-intermodal-capacity-outlook-west-coast',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Container rail turn times in Los Angeles and Long Beach stabilized in October, but drayage chassis availability remains tight ahead of peak retail replenishment."}]}]}'::jsonb,
    'Operational guidance for shippers booking drayage and domestic rail capacity through December.',
    'draft',
    null,
    null,
    null,
    now() - interval '2 days',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Automating Multi-Entity Revenue Recognition Under ASC 606',
    'automating-multi-entity-revenue-recognition-asc-606',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Finance teams managing multiple subsidiaries often reconcile deferred revenue schedules in disconnected spreadsheets. Ledgerline now links contract modifications directly to journal entry templates."}]}]}'::jsonb,
    'A practical breakdown of automated performance obligation tracking for multi-subsidiary finance teams.',
    'published',
    'Multi-Entity ASC 606 Automation | Ledgerline',
    'How multi-subsidiary finance teams automate deferred revenue schedules and contract modifications.',
    now() - interval '9 days',
    now() - interval '12 days',
    now() - interval '9 days'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Closing the Books in Four Days: Lessons from 40 Controllers',
    'closing-the-books-in-four-days',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"We surveyed 40 mid-market controllers to identify which pre-close checklists and bank feed rules actually shorten month-end close without sacrificing auditability."}]}]}'::jsonb,
    'Benchmark data on month-end close bottlenecks and automated reconciliation workflows.',
    'published',
    'Closing the Books in Four Days | Ledgerline',
    'Benchmark findings from 40 controllers on shortening month-end close cycles.',
    now() - interval '2 days',
    now() - interval '5 days',
    now() - interval '2 days'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Designing Prior Authorization Workflows for Outpatient Clinics',
    'prior-authorization-workflows-outpatient-clinics',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Manual payer portal checks consume an average of 14 hours per clinician each week. Structured EHR intake fields reduce missing-documentation denials at the source."}]}]}'::jsonb,
    'Standardizing clinical documentation at intake to prevent avoidable payer denials.',
    'published',
    'Outpatient Prior Authorization Workflows | Caldera Health',
    'How outpatient clinics reduce payer denials through structured EHR intake.',
    now() - interval '11 days',
    now() - interval '15 days',
    now() - interval '11 days'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'HIPAA Audit Logging for Distributed Care Teams',
    'hipaa-audit-logging-distributed-care-teams',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Draft outline covering immutable access logs, break-the-glass workflows, and quarterly access reviews for regional clinics."}]}]}'::jsonb,
    'Implementation notes on immutable PHI access logging and break-the-glass alerting.',
    'draft',
    null,
    null,
    null,
    now() - interval '3 days',
    now() - interval '12 hours'
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'Zero-Downtime Postgres Migrations at 120k Writes per Minute',
    'zero-downtime-postgres-migrations',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Adding non-null constraints or rewriting wide tables under sustained write load requires expand-and-contract steps and strict lock timeouts."}]}]}'::jsonb,
    'Field notes on lock timeouts, backfill batching, and safe constraint validation in PostgreSQL.',
    'published',
    'Zero-Downtime Postgres Migrations | Fieldwork Labs',
    'Safe schema evolution patterns for high-throughput PostgreSQL clusters.',
    now() - interval '6 days',
    now() - interval '8 days',
    now() - interval '6 days'
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'Grid-Scale Battery Dispatch During Winter Peak Events',
    'grid-scale-battery-dispatch-winter-peak',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Coordinating 4-hour lithium-iron-phosphate storage assets with day-ahead price forecasts improves winter peak shaving reliability across coastal substations."}]}]}'::jsonb,
    'How day-ahead state-of-charge modeling improves winter substation dispatch.',
    'published',
    'Grid-Scale Battery Dispatch | Harborline Energy',
    'Coordinating 4-hour storage assets with day-ahead forecasts during winter peak events.',
    now() - interval '14 days',
    now() - interval '16 days',
    now() - interval '14 days'
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    'Last-Mile Route Density in High-Rise Urban Corridors',
    'last-mile-route-density-urban-corridors',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Consolidating building-level delivery windows with locker drop-offs reduces double-parked stop time by 31% in dense commercial districts."}]}]}'::jsonb,
    'Parcel consolidation tactics for dense downtown delivery zones.',
    'draft',
    null,
    null,
    null,
    now() - interval '1 day',
    now() - interval '6 hours'
  ),
  (
    '11111111-1111-4111-8111-111111111107',
    'Multi-Region Failover Drills: What Actually Breaks',
    'multi-region-failover-drills-what-breaks',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"DNS TTL propagation, stale connection pools, and cross-region queue consumers are the three most common failure modes uncovered during quarterly game days."}]}]}'::jsonb,
    'Post-mortem takeaways from running live active-passive region failovers.',
    'published',
    'Multi-Region Failover Drills | Meridian Cloud',
    'Common failure modes in DNS, connection pooling, and queues during live failover drills.',
    now() - interval '3 days',
    now() - interval '5 days',
    now() - interval '3 days'
  )
on conflict (company_id, slug) do nothing;
