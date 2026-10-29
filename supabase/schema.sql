-- Apply in the Supabase SQL editor only after reviewing.
-- This schema supports user-owned content and a durable approval audit trail.
create extension if not exists pgcrypto;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  format text not null check (format in ('Carousel','Single post','Story sequence','Reel')),
  pillar text not null check (pillar in ('Story Trails','Little Tinkers','Together Time','Curious World')),
  caption text not null default '',
  cta text not null default '',
  planned_at timestamptz,
  status text not null default 'draft' check (status in ('draft','review','approved','scheduled','published','rejected')),
  version integer not null default 1,
  approved_version integer,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_version_consistent check (
    status not in ('approved','scheduled','published') or
    (approved_version is not null and approved_version = version and approved_at is not null and approved_by is not null)
  )
);

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_kind text not null check (asset_kind in ('slide','story_frame','cover','reel_video','other')),
  sort_order integer not null default 0,
  storage_path text not null,
  alt_text text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.approval_events (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_version integer not null,
  action text not null check (action in ('submitted_for_review','approved','returned_to_draft','rejected','publish_confirmed','publish_succeeded','publish_failed')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_email text,
  reminder_review boolean not null default true,
  reminder_before_publish boolean not null default true,
  reminder_weekly boolean not null default false,
  timezone text not null default 'Asia/Kolkata',
  brand_voice text not null default 'Warm, playful, inclusive and curious',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items enable row level security;
alter table public.content_assets enable row level security;
alter table public.approval_events enable row level security;
alter table public.user_preferences enable row level security;

create policy "owners manage own content" on public.content_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners manage own assets" on public.content_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owners read own approval events" on public.approval_events
  for select using (auth.uid() = user_id);
create policy "owners create own approval events" on public.approval_events
  for insert with check (auth.uid() = user_id);
create policy "owners manage own preferences" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Production note:
-- Do not let the browser set approved_version / approved_by / approved_at directly.
-- Move approval transitions to a server-only function after verifying identity and
-- current version, and invalidate approval whenever any publishable content changes.

-- Private bucket for AI-generated and uploaded creative assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creative-assets', 'creative-assets', false, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/png','image/jpeg','image/webp'];

create policy "Users can view their own creative files" on storage.objects
  for select to authenticated using (bucket_id = 'creative-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can upload their own creative files" on storage.objects
  for insert to authenticated with check (bucket_id = 'creative-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update their own creative files" on storage.objects
  for update to authenticated using (bucket_id = 'creative-assets' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'creative-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete their own creative files" on storage.objects
  for delete to authenticated using (bucket_id = 'creative-assets' and (storage.foldername(name))[1] = auth.uid()::text);
