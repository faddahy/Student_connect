-- =====================================================================
-- Faddahy Social — upgrade from Student Connect
-- Idempotent. Safe to run more than once in the SQL editor.
-- Opens sign-up to any email, follows @yagyok, and adds the social,
-- verification, ads, dating-hold, games, anonymous, and Secret Zone tables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Open sign-up. Any address with an @ is accepted.
-- ---------------------------------------------------------------------
create or replace function public.enforce_email_domain()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or position('@' in new.email) = 0 then
    raise exception 'A valid email address is required'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(event->'user'->>'email', ''));
begin
  if position('@' in v_email) = 0 then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'A valid email address is required'));
  end if;
  return '{}'::jsonb;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Profile columns for the social product
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists country_code text;
alter table public.profiles add column if not exists nigerian boolean;
alter table public.profiles add column if not exists blue_tick boolean not null default false;
alter table public.profiles add column if not exists kyc_status text not null default 'none';
alter table public.profiles add column if not exists premium_plan text;
alter table public.profiles add column if not exists premium_since timestamptz;
alter table public.profiles add column if not exists straight_premium_months int not null default 0;
alter table public.profiles add column if not exists straight_active_days int not null default 0;
alter table public.profiles add column if not exists earnings_ngn numeric not null default 0;
alter table public.profiles add column if not exists held_ngn numeric not null default 0;
alter table public.profiles add column if not exists role text not null default 'member';

alter table public.profiles drop constraint if exists profiles_region_check;
alter table public.profiles add constraint profiles_region_check
  check (region is null or region in ('nigeria', 'africa', 'foreign'));
alter table public.profiles drop constraint if exists profiles_kyc_status_check;
alter table public.profiles add constraint profiles_kyc_status_check
  check (kyc_status in ('none', 'pending', 'approved', 'rejected'));
alter table public.profiles drop constraint if exists profiles_premium_plan_check;
alter table public.profiles add constraint profiles_premium_plan_check
  check (premium_plan is null or premium_plan in ('monthly', 'fast_track', 'yearly'));
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'admin', 'founder'));
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles add constraint profiles_username_check
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

update public.profiles
set username = 'user_' || left(replace(id::text, '-', ''), 12)
where username is null;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Social onboarding no longer requires dating photos.
create or replace function public.validate_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.dob is not null and new.dob > (current_date - interval '18 years')::date then
    raise exception 'You must be at least 18 years old' using errcode = 'check_violation';
  end if;
  if new.dob is not null and new.dob < (current_date - interval '80 years')::date then
    raise exception 'Please enter a valid date of birth' using errcode = 'check_violation';
  end if;
  if new.onboarded and (new.display_name is null or new.dob is null or new.username is null) then
    raise exception 'Profile is incomplete' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from unnest(new.photos) p
    where p not like new.id::text || '/%' and p not like 'data:%'
  ) then
    raise exception 'Invalid photo path' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

grant update (username, region, country_code, nigerian)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 3. Follows, including the automatic follow of @yagyok
-- ---------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;

drop policy if exists "follows: read" on public.follows;
create policy "follows: read" on public.follows for select to authenticated using (true);
drop policy if exists "follows: follow" on public.follows;
create policy "follows: follow" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
drop policy if exists "follows: unfollow" on public.follows;
create policy "follows: unfollow" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

create or replace function public.auto_follow_founder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  founder uuid;
begin
  select id into founder from public.profiles where username = 'yagyok' limit 1;
  if founder is not null and founder <> new.id then
    insert into public.follows (follower_id, following_id)
    values (new.id, founder)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists auto_follow_founder on public.profiles;
create trigger auto_follow_founder
  after insert on public.profiles
  for each row execute function public.auto_follow_founder();

create or replace function public.backfill_founder_follows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.username = 'yagyok' and (tg_op = 'INSERT' or old.username is distinct from new.username) then
    insert into public.follows (follower_id, following_id)
    select p.id, new.id from public.profiles p where p.id <> new.id
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists backfill_founder_follows on public.profiles;
create trigger backfill_founder_follows
  after insert or update of username on public.profiles
  for each row execute function public.backfill_founder_follows();

insert into public.follows (follower_id, following_id)
select p.id, f.id
from public.profiles p
join public.profiles f on f.username = 'yagyok'
where p.id <> f.id
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text := left(regexp_replace(lower(split_part(coalesce(new.email, 'user'), '@', 1)), '[^a-z0-9_]', '', 'g'), 12);
  v_name text;
begin
  if v_base is null or length(v_base) < 3 then
    v_base := 'user';
  end if;
  v_name := v_base;
  while exists (select 1 from public.profiles where lower(username) = v_name) loop
    v_name := left(v_base, 8) || substr(md5(new.id::text || v_name), 1, 4);
  end loop;
  insert into public.profiles (id, email, username)
  values (new.id, new.email, v_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Groups, posts, engagement
-- ---------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null check (char_length(name) between 2 and 80),
  about text check (char_length(about) <= 500),
  is_public boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.groups enable row level security;
drop policy if exists "groups: read public" on public.groups;
create policy "groups: read public" on public.groups for select to authenticated using (is_public);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;
drop policy if exists "group_members: read" on public.group_members;
create policy "group_members: read" on public.group_members for select to authenticated using (true);
drop policy if exists "group_members: join" on public.group_members;
create policy "group_members: join" on public.group_members
  for insert to authenticated with check (user_id = auth.uid());

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('original', 'distribute', 'contribute')),
  body text not null default '' check (char_length(body) <= 500),
  original_post_id uuid references public.posts (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (kind = 'original' and original_post_id is null and char_length(body) > 0)
    or (kind = 'distribute' and original_post_id is not null and body = '')
    or (kind = 'contribute' and original_post_id is not null and char_length(body) > 0)
  )
);
create index if not exists posts_created_idx on public.posts (created_at desc);
alter table public.posts enable row level security;

create or replace function public.enforce_post_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_kind text;
begin
  if new.kind in ('distribute', 'contribute') then
    select kind into target_kind from public.posts where id = new.original_post_id;
    if target_kind is null then
      raise exception 'That post does not exist' using errcode = 'check_violation';
    end if;
    if target_kind <> 'original' then
      raise exception 'Quote the original post, or comment on the Contribute post'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_post_rules on public.posts;
create trigger enforce_post_rules
  before insert or update on public.posts
  for each row execute function public.enforce_post_rules();

drop policy if exists "posts: read visible" on public.posts;
create policy "posts: read visible" on public.posts
  for select to authenticated
  using (
    author_id = auth.uid()
    or (
      group_id is not null
      and exists (
        select 1 from public.group_members gm
        where gm.group_id = posts.group_id and gm.user_id = auth.uid()
      )
    )
    or (
      group_id is null
      and not public.is_blocked_between(auth.uid(), author_id)
    )
  );

drop policy if exists "posts: write own" on public.posts;
create policy "posts: write own" on public.posts
  for insert to authenticated
  with check (author_id = auth.uid());

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
drop policy if exists "likes: read" on public.post_likes;
create policy "likes: read" on public.post_likes for select to authenticated using (true);
drop policy if exists "likes: write own" on public.post_likes;
create policy "likes: write own" on public.post_likes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "likes: delete own" on public.post_likes;
create policy "likes: delete own" on public.post_likes
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;
drop policy if exists "comments: read" on public.post_comments;
create policy "comments: read" on public.post_comments for select to authenticated using (true);
drop policy if exists "comments: write own" on public.post_comments;
create policy "comments: write own" on public.post_comments
  for insert to authenticated with check (author_id = auth.uid());

create table if not exists public.distribution_channels (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  window_start timestamptz not null default now(),
  window_kind text not null default 'post' check (window_kind in ('post', 'account')),
  online boolean not null default true,
  closed boolean not null default false,
  fresh_interest boolean not null default true,
  primary key (user_id, post_id)
);
alter table public.distribution_channels enable row level security;
drop policy if exists "channels: read own" on public.distribution_channels;
create policy "channels: read own" on public.distribution_channels
  for select to authenticated using (user_id = auth.uid());

-- A like opens a channel. An unlike closes it and does not create a new one.
create or replace function public.open_channel_on_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
begin
  select kind into v_kind from public.posts where id = new.post_id;
  if v_kind = 'distribute' then
    raise exception 'Interact with the original post' using errcode = 'check_violation';
  end if;
  if public.is_blocked_between(new.user_id, (select author_id from public.posts where id = new.post_id)) then
    raise exception 'Direct interaction is closed by a block' using errcode = 'check_violation';
  end if;
  insert into public.distribution_channels (user_id, post_id, closed, fresh_interest)
  values (new.user_id, new.post_id, false, true)
  on conflict (user_id, post_id) do update
    set closed = false, fresh_interest = true, online = true, window_start = now();
  return new;
end;
$$;

drop trigger if exists open_channel_on_like on public.post_likes;
create trigger open_channel_on_like
  after insert on public.post_likes
  for each row execute function public.open_channel_on_like();

create or replace function public.close_channel_on_unlike()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.distribution_channels
  set closed = true, fresh_interest = false
  where user_id = old.user_id and post_id = old.post_id;
  return old;
end;
$$;

drop trigger if exists close_channel_on_unlike on public.post_likes;
create trigger close_channel_on_unlike
  after delete on public.post_likes
  for each row execute function public.close_channel_on_unlike();

create or replace function public.enforce_comment_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_author uuid;
begin
  select kind, author_id into v_kind, v_author from public.posts where id = new.post_id;
  if v_kind = 'distribute' then
    raise exception 'Comment on the original post' using errcode = 'check_violation';
  end if;
  if public.is_blocked_between(new.author_id, v_author) then
    raise exception 'Direct interaction is closed by a block' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_comment_rules on public.post_comments;
create trigger enforce_comment_rules
  before insert on public.post_comments
  for each row execute function public.enforce_comment_rules();

-- ---------------------------------------------------------------------
-- 5. Direct messages respect blocks. Group posts stay visible above.
-- ---------------------------------------------------------------------
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references public.profiles (id) on delete cascade,
  recipient uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender <> recipient)
);
alter table public.direct_messages enable row level security;
drop policy if exists "dm: read own" on public.direct_messages;
create policy "dm: read own" on public.direct_messages
  for select to authenticated using (auth.uid() in (sender, recipient));
drop policy if exists "dm: send" on public.direct_messages;
create policy "dm: send" on public.direct_messages
  for insert to authenticated
  with check (
    sender = auth.uid()
    and not public.is_blocked_between(sender, recipient)
  );

-- ---------------------------------------------------------------------
-- 6. KYC, bank transfers, blue tick
-- ---------------------------------------------------------------------
create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  audience text not null check (audience in ('nigerian', 'other')),
  selfie_path text not null,
  document_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.kyc_submissions enable row level security;
drop policy if exists "kyc: read own" on public.kyc_submissions;
create policy "kyc: read own" on public.kyc_submissions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "kyc: insert own" on public.kyc_submissions;
create policy "kyc: insert own" on public.kyc_submissions
  for insert to authenticated with check (user_id = auth.uid());

create table if not exists public.bank_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  region text not null check (region in ('nigeria', 'africa', 'foreign')),
  plan text not null check (plan in ('monthly', 'fast_track', 'yearly')),
  amount numeric not null check (amount > 0),
  currency text not null check (currency in ('NGN', 'USD')),
  reference text not null,
  receipt_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.bank_transfers enable row level security;
drop policy if exists "transfers: read own" on public.bank_transfers;
create policy "transfers: read own" on public.bank_transfers
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "transfers: insert own" on public.bank_transfers;
create policy "transfers: insert own" on public.bank_transfers
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');

-- ---------------------------------------------------------------------
-- 7. Mimic advertisers
-- ---------------------------------------------------------------------
create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  name text not null,
  logo_path text,
  created_at timestamptz not null default now()
);
alter table public.advertisers enable row level security;
drop policy if exists "advertisers: read" on public.advertisers;
create policy "advertisers: read" on public.advertisers for select to authenticated using (true);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  cta text,
  active boolean not null default true,
  spend_ngn numeric not null default 0,
  impressions int not null default 0,
  clicks int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ad_campaigns enable row level security;
drop policy if exists "campaigns: read active" on public.ad_campaigns;
create policy "campaigns: read active" on public.ad_campaigns
  for select to authenticated using (active);

-- ---------------------------------------------------------------------
-- 8. Dating holds. The fee is not deducted until both confirm.
-- ---------------------------------------------------------------------
create table if not exists public.date_holds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  counterparty uuid not null references public.profiles (id) on delete cascade,
  amount_ngn numeric not null default 100 check (amount_ngn = 100),
  status text not null default 'held' check (status in ('held', 'spent', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (user_id <> counterparty)
);
alter table public.date_holds enable row level security;
drop policy if exists "holds: read own" on public.date_holds;
create policy "holds: read own" on public.date_holds
  for select to authenticated using (auth.uid() in (user_id, counterparty));
drop policy if exists "holds: place own" on public.date_holds;
create policy "holds: place own" on public.date_holds
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.blue_tick)
  );

-- ---------------------------------------------------------------------
-- 9. Games
-- ---------------------------------------------------------------------
create table if not exists public.game_tables (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('whot', 'ludo')),
  mode text not null check (mode in ('free', 'paid')),
  stake_ngn int not null default 0,
  host_id uuid references public.profiles (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'playing', 'settled')),
  created_at timestamptz not null default now(),
  check (
    (mode = 'free' and stake_ngn = 0)
    or (mode = 'paid' and stake_ngn between 100 and 1000 and stake_ngn % 100 = 0)
  )
);
alter table public.game_tables enable row level security;
drop policy if exists "games: read" on public.game_tables;
create policy "games: read" on public.game_tables for select to authenticated using (true);
drop policy if exists "games: host" on public.game_tables;
create policy "games: host" on public.game_tables
  for insert to authenticated with check (host_id = auth.uid());

create or replace function public.paid_play_payout(stake int, players int)
returns jsonb
language plpgsql
immutable
as $$
declare
  gross numeric;
  fee numeric;
  net numeric;
begin
  if stake < 100 or stake > 1000 or stake % 100 <> 0 then
    raise exception 'Stake must be ₦100–₦1,000 in ₦100 steps';
  end if;
  if players < 2 then
    raise exception 'Paid play needs at least 2 players';
  end if;
  gross := stake * players;
  fee := round(gross * 0.01, 2);
  net := gross - fee;
  return jsonb_build_object(
    'gross', gross,
    'faddahy_fee', fee,
    'net', net,
    'organizer', round(net * 0.30, 2),
    'winner', round(net * 0.70, 2)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 10. Anonymous notes. Sending is limited to blue-tick members.
-- ---------------------------------------------------------------------
create table if not exists public.anonymous_notes (
  id uuid primary key default gen_random_uuid(),
  recipient uuid not null references public.profiles (id) on delete cascade,
  sender uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.anonymous_notes enable row level security;

drop policy if exists "anon: read public or own inbox" on public.anonymous_notes;
create policy "anon: read public or own inbox" on public.anonymous_notes
  for select to authenticated
  using (is_public or recipient = auth.uid());

drop policy if exists "anon: blue tick sends" on public.anonymous_notes;
create policy "anon: blue tick sends" on public.anonymous_notes
  for insert to authenticated
  with check (
    sender = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.blue_tick)
  );

-- ---------------------------------------------------------------------
-- 11. Secret Zone. No ad tables are referenced from here.
-- ---------------------------------------------------------------------
create table if not exists public.secret_creators (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  title text not null,
  about text check (char_length(about) <= 500),
  active boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.secret_creators enable row level security;
drop policy if exists "secret creators: read active" on public.secret_creators;
create policy "secret creators: read active" on public.secret_creators
  for select to authenticated using (active or user_id = auth.uid());
drop policy if exists "secret creators: own row" on public.secret_creators;
create policy "secret creators: own row" on public.secret_creators
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.blue_tick and p.kyc_status = 'approved')
  );

create table if not exists public.secret_videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.secret_creators (user_id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);
alter table public.secret_videos enable row level security;
drop policy if exists "secret videos: creator upload" on public.secret_videos;
create policy "secret videos: creator upload" on public.secret_videos
  for insert to authenticated with check (creator_id = auth.uid());

create table if not exists public.secret_subscriptions (
  subscriber_id uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.secret_creators (user_id) on delete cascade,
  amount_ngn numeric not null default 1000 check (amount_ngn = 1000),
  active boolean not null default true,
  period_start date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (subscriber_id, creator_id)
);
alter table public.secret_subscriptions enable row level security;
drop policy if exists "subs: read own" on public.secret_subscriptions;
create policy "subs: read own" on public.secret_subscriptions
  for select to authenticated using (subscriber_id = auth.uid() or creator_id = auth.uid());
drop policy if exists "subs: start own" on public.secret_subscriptions;
create policy "subs: start own" on public.secret_subscriptions
  for insert to authenticated with check (subscriber_id = auth.uid());

drop policy if exists "secret videos: subscribers or creator" on public.secret_videos;
create policy "secret videos: subscribers or creator" on public.secret_videos
  for select to authenticated using (
    creator_id = auth.uid()
    or exists (
      select 1 from public.secret_subscriptions s
      where s.creator_id = secret_videos.creator_id
        and s.subscriber_id = auth.uid()
        and s.active
    )
  );

create or replace function public.secret_zone_split(months int default 1)
returns jsonb
language plpgsql
immutable
as $$
declare
  gross numeric := 1000 * greatest(months, 1);
begin
  return jsonb_build_object(
    'gross', gross,
    'creator', round(gross * 0.70, 2),
    'faddahy', round(gross * 0.30, 2)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 12. Private storage for KYC, receipts, and Secret Zone video
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('kyc', 'kyc', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('secret-videos', 'secret-videos', false, 52428800, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "kyc: upload own" on storage.objects;
create policy "kyc: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "receipts: upload own" on storage.objects;
create policy "receipts: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "secret videos: upload own" on storage.objects;
create policy "secret videos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'secret-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "secret videos: read own folder" on storage.objects;
create policy "secret videos: read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'secret-videos' and (storage.foldername(name))[1] = auth.uid()::text);
