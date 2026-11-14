-- =====================================================================
-- Student Connect — initial schema
-- Run in Supabase: SQL Editor -> New query -> paste -> Run
-- (or `supabase db push` with the Supabase CLI)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Allowed sign-up email domains (server-side enforcement)
-- ---------------------------------------------------------------------
create table if not exists public.allowed_email_domains (
  domain text primary key check (domain = lower(domain))
);
alter table public.allowed_email_domains enable row level security;
-- Nobody can read/write via the API; only the SQL editor / service role.

-- FUT Minna student email domain (verified: student emails are
-- <student_id or name>@st.futminna.edu.ng, issued by the university).
insert into public.allowed_email_domains (domain)
values ('st.futminna.edu.ng')
on conflict do nothing;

create or replace function public.enforce_email_domain()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_domain text := lower(split_part(coalesce(new.email, ''), '@', 2));
begin
  if new.email is null or not exists (
    select 1 from public.allowed_email_domains d where d.domain = v_domain
  ) then
    raise exception 'Sign-up is only open to FUT Minna student email addresses'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_email_domain_on_insert on auth.users;
create trigger enforce_email_domain_on_insert
  before insert on auth.users
  for each row execute function public.enforce_email_domain();

drop trigger if exists enforce_email_domain_on_update on auth.users;
create trigger enforce_email_domain_on_update
  before update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.enforce_email_domain();

-- Optional second layer: Supabase "Before User Created" auth hook.
-- Enable it in Dashboard -> Authentication -> Hooks -> Before User Created ->
-- Postgres function -> public.hook_before_user_created. It returns a clean
-- 403 message instead of a generic database error.
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(event->'user'->>'email', ''));
begin
  if not exists (
    select 1 from public.allowed_email_domains d
    where d.domain = split_part(v_email, '@', 2)
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Sign-up is only open to FUT Minna student email addresses'));
  end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
    grant select on public.allowed_email_domains to supabase_auth_admin;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. Profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text check (char_length(display_name) between 2 and 40),
  dob date,
  gender text check (gender in ('man', 'woman', 'nonbinary')),
  interested_in text[] not null default '{}'
    check (interested_in <@ array['man', 'woman', 'nonbinary']::text[]),
  department text check (char_length(department) <= 80),
  level int check (level in (100, 200, 300, 400, 500, 600, 700)),
  bio text check (char_length(bio) <= 500),
  interests text[] not null default '{}' check (cardinality(interests) <= 10),
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  onboarded boolean not null default false,
  is_banned boolean not null default false,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Create a profile row automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 18+ only, and onboarding completeness.
create or replace function public.validate_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.dob is not null and new.dob > (current_date - interval '18 years')::date then
    raise exception 'You must be at least 18 years old to use Student Connect'
      using errcode = 'check_violation';
  end if;
  if new.dob is not null and new.dob < (current_date - interval '80 years')::date then
    raise exception 'Please enter a valid date of birth' using errcode = 'check_violation';
  end if;
  if new.onboarded and (
       new.display_name is null or new.dob is null or new.gender is null
       or cardinality(new.interested_in) = 0 or cardinality(new.photos) = 0
     ) then
    raise exception 'Profile is incomplete' using errcode = 'check_violation';
  end if;
  -- Photos must live in the user's own storage folder.
  if exists (
    select 1 from unnest(new.photos) p where p not like new.id::text || '/%'
  ) then
    raise exception 'Invalid photo path' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_profile on public.profiles;
create trigger validate_profile
  before insert or update on public.profiles
  for each row execute function public.validate_profile();

-- Users can read only their own full row (email/dob stay private).
-- Other users' public info is exposed only via the RPC functions below.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Column-level protection: users cannot change email / ban flag / id.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, dob, gender, interested_in, department, level, bio,
              interests, photos, onboarded, last_active)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 3. Blocks
-- ---------------------------------------------------------------------
create table if not exists public.blocks (
  blocker uuid not null references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
alter table public.blocks enable row level security;

drop policy if exists "blocks: read own" on public.blocks;
create policy "blocks: read own" on public.blocks
  for select to authenticated using (blocker = auth.uid());
drop policy if exists "blocks: create own" on public.blocks;
create policy "blocks: create own" on public.blocks
  for insert to authenticated with check (blocker = auth.uid());
drop policy if exists "blocks: delete own" on public.blocks;
create policy "blocks: delete own" on public.blocks
  for delete to authenticated using (blocker = auth.uid());

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker = a and blocked = b) or (blocker = b and blocked = a)
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Swipes & matches
-- ---------------------------------------------------------------------
create table if not exists public.swipes (
  swiper uuid not null references public.profiles (id) on delete cascade,
  target uuid not null references public.profiles (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (swiper, target),
  check (swiper <> target)
);
alter table public.swipes enable row level security;

drop policy if exists "swipes: read own" on public.swipes;
create policy "swipes: read own" on public.swipes
  for select to authenticated using (swiper = auth.uid());
drop policy if exists "swipes: create own" on public.swipes;
create policy "swipes: create own" on public.swipes
  for insert to authenticated with check (swiper = auth.uid());

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
alter table public.matches enable row level security;

drop policy if exists "matches: read own" on public.matches;
create policy "matches: read own" on public.matches
  for select to authenticated using (auth.uid() in (user_a, user_b));
drop policy if exists "matches: unmatch" on public.matches;
create policy "matches: unmatch" on public.matches
  for delete to authenticated using (auth.uid() in (user_a, user_b));

create or replace function public.handle_swipe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.liked
     and not public.is_blocked_between(new.swiper, new.target)
     and exists (
       select 1 from public.swipes s
       where s.swiper = new.target and s.target = new.swiper and s.liked
     )
  then
    insert into public.matches (user_a, user_b)
    values (least(new.swiper, new.target), greatest(new.swiper, new.target))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_swipe on public.swipes;
create trigger on_swipe
  after insert on public.swipes
  for each row execute function public.handle_swipe();

-- Blocking someone removes any match with them.
create or replace function public.handle_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.matches
  where user_a = least(new.blocker, new.blocked)
    and user_b = greatest(new.blocker, new.blocked);
  return new;
end;
$$;

drop trigger if exists on_block on public.blocks;
create trigger on_block
  after insert on public.blocks
  for each row execute function public.handle_block();

-- ---------------------------------------------------------------------
-- 5. Messages (realtime chat between matches only)
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_match_created_idx
  on public.messages (match_id, created_at);
alter table public.messages enable row level security;

create or replace function public.is_match_member(m uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches
    where id = m and auth.uid() in (user_a, user_b)
  );
$$;

drop policy if exists "messages: read in own matches" on public.messages;
create policy "messages: read in own matches" on public.messages
  for select to authenticated using (public.is_match_member(match_id));

drop policy if exists "messages: send in own matches" on public.messages;
create policy "messages: send in own matches" on public.messages
  for insert to authenticated
  with check (
    sender = auth.uid()
    and public.is_match_member(match_id)
    and not exists (select 1 from public.profiles where id = auth.uid() and is_banned)
  );

-- Enable realtime for chat.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 6. Reports (reviewed by the admin via the service-role key)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles (id) on delete cascade,
  reported uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in
    ('fake_profile', 'harassment', 'inappropriate_content', 'underage', 'scam', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  created_at timestamptz not null default now(),
  check (reporter <> reported)
);
alter table public.reports enable row level security;

drop policy if exists "reports: create own" on public.reports;
create policy "reports: create own" on public.reports
  for insert to authenticated with check (reporter = auth.uid());

-- ---------------------------------------------------------------------
-- 7. RPC functions (safe public views of other profiles)
-- ---------------------------------------------------------------------
create or replace function public.age_of(d date)
returns int language sql immutable as $$
  select extract(year from age(current_date, d))::int;
$$;

create or replace function public.get_discover_feed(p_limit int default 20)
returns table (
  id uuid, display_name text, age int, gender text, department text,
  level int, bio text, interests text[], photos text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, public.age_of(p.dob), p.gender, p.department,
         p.level, p.bio, p.interests, p.photos
  from public.profiles me
  join public.profiles p on p.id <> me.id
  where me.id = auth.uid()
    and me.onboarded and not me.is_banned
    and p.onboarded and not p.is_banned
    and p.gender = any (me.interested_in)
    and me.gender = any (p.interested_in)
    and not exists (select 1 from public.swipes s where s.swiper = me.id and s.target = p.id)
    and not public.is_blocked_between(me.id, p.id)
  order by p.last_active desc, random()
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.get_matches()
returns table (
  match_id uuid, matched_at timestamptz, user_id uuid, display_name text,
  age int, department text, level int, bio text, interests text[], photos text[],
  last_message text, last_message_at timestamptz, last_sender uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.created_at, p.id, p.display_name, public.age_of(p.dob),
         p.department, p.level, p.bio, p.interests, p.photos,
         lm.body, lm.created_at, lm.sender
  from public.matches m
  join public.profiles p
    on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  left join lateral (
    select body, created_at, sender from public.messages
    where match_id = m.id order by created_at desc limit 1
  ) lm on true
  where auth.uid() in (m.user_a, m.user_b)
    and not p.is_banned
  order by coalesce(lm.created_at, m.created_at) desc;
$$;

revoke all on function public.get_discover_feed(int) from public, anon;
revoke all on function public.get_matches() from public, anon;
grant execute on function public.get_discover_feed(int) to authenticated;
grant execute on function public.get_matches() to authenticated;
revoke all on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;
revoke all on function public.is_match_member(uuid) from public, anon;
grant execute on function public.is_match_member(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Storage bucket for profile photos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files are stored as photos/<user_id>/<file>. Users manage only their folder.
drop policy if exists "photos: upload own" on storage.objects;
create policy "photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos: update own" on storage.objects;
create policy "photos: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos: delete own" on storage.objects;
create policy "photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
