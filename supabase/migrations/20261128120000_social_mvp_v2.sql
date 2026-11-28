-- =====================================================================
-- D'Luck MVP v2
-- Additive and idempotent. Safe to run in the SQL editor on a database
-- that already has 20261126120000_faddahy_social.sql.
-- Does not rename existing tables, columns, or functions.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Posts: views, dislikes, ad reposts, comment replies and reactions
-- ---------------------------------------------------------------------
alter table public.posts add column if not exists ad_campaign_id uuid references public.ad_campaigns (id) on delete cascade;

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.posts'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%original_post_id%'
  loop
    execute format('alter table public.posts drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.posts drop constraint if exists posts_shape_check;
alter table public.posts add constraint posts_shape_check check (
  (kind = 'original' and original_post_id is null and ad_campaign_id is null and char_length(body) > 0)
  or (
    kind = 'distribute' and body = '' and (
      (original_post_id is not null and ad_campaign_id is null)
      or (original_post_id is null and ad_campaign_id is not null)
    )
  )
  or (
    kind = 'contribute' and char_length(body) > 0 and (
      (original_post_id is not null and ad_campaign_id is null)
      or (original_post_id is null and ad_campaign_id is not null)
    )
  )
);

create index if not exists posts_ad_campaign_idx on public.posts (ad_campaign_id);

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
    if new.original_post_id is not null and new.ad_campaign_id is not null then
      raise exception 'A repost references a post or an ad, not both' using errcode = 'check_violation';
    end if;
    if new.ad_campaign_id is not null then
      if not exists (select 1 from public.ad_campaigns c where c.id = new.ad_campaign_id) then
        raise exception 'That ad does not exist' using errcode = 'check_violation';
      end if;
      return new;
    end if;
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

create table if not exists public.post_views (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_views enable row level security;
drop policy if exists "views: read" on public.post_views;
create policy "views: read" on public.post_views for select to authenticated using (true);
drop policy if exists "views: write own" on public.post_views;
create policy "views: write own" on public.post_views
  for insert to authenticated with check (user_id = (select auth.uid()));
create index if not exists post_views_user_idx on public.post_views (user_id);

create table if not exists public.post_dislikes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_dislikes enable row level security;
drop policy if exists "dislikes: read" on public.post_dislikes;
create policy "dislikes: read" on public.post_dislikes for select to authenticated using (true);
drop policy if exists "dislikes: write own" on public.post_dislikes;
create policy "dislikes: write own" on public.post_dislikes
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "dislikes: delete own" on public.post_dislikes;
create policy "dislikes: delete own" on public.post_dislikes
  for delete to authenticated using (user_id = (select auth.uid()));
create index if not exists post_dislikes_user_idx on public.post_dislikes (user_id);

-- A dislike closes distribution for that member and cancels their like.
create or replace function public.block_channel_on_dislike()
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
    raise exception 'Interact with the original post' using errcode = 'check_violation';
  end if;
  if public.is_blocked_between(new.user_id, v_author) then
    raise exception 'Direct interaction is closed by a block' using errcode = 'check_violation';
  end if;
  delete from public.post_likes where post_id = new.post_id and user_id = new.user_id;
  insert into public.distribution_channels (user_id, post_id, closed, fresh_interest, online)
  values (new.user_id, new.post_id, true, false, false)
  on conflict (user_id, post_id) do update
    set closed = true, fresh_interest = false, online = false;
  return new;
end;
$$;

drop trigger if exists block_channel_on_dislike on public.post_dislikes;
create trigger block_channel_on_dislike
  after insert on public.post_dislikes
  for each row execute function public.block_channel_on_dislike();

create or replace function public.clear_dislike_on_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.post_dislikes where post_id = new.post_id and user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists clear_dislike_on_like on public.post_likes;
create trigger clear_dislike_on_like
  after insert on public.post_likes
  for each row execute function public.clear_dislike_on_like();

alter table public.post_comments add column if not exists parent_id uuid references public.post_comments (id) on delete cascade;
create index if not exists post_comments_parent_idx on public.post_comments (parent_id);

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
  if new.parent_id is not null and not exists (
    select 1 from public.post_comments parent
    where parent.id = new.parent_id and parent.post_id = new.post_id
  ) then
    raise exception 'Reply must stay on the same post' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create table if not exists public.comment_reactions (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.comment_reactions enable row level security;
drop policy if exists "comment reactions: read" on public.comment_reactions;
create policy "comment reactions: read" on public.comment_reactions for select to authenticated using (true);
drop policy if exists "comment reactions: write own" on public.comment_reactions;
create policy "comment reactions: write own" on public.comment_reactions
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "comment reactions: update own" on public.comment_reactions;
create policy "comment reactions: update own" on public.comment_reactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "comment reactions: delete own" on public.comment_reactions;
create policy "comment reactions: delete own" on public.comment_reactions
  for delete to authenticated using (user_id = (select auth.uid()));
create index if not exists comment_reactions_user_idx on public.comment_reactions (user_id);

-- Owner-liked premium, owner-liked free, regular, owner-disliked premium, owner-disliked free.
create or replace function public.comment_tier(owner_reaction text, premium boolean)
returns int
language sql
immutable
as $$
  select case
    when owner_reaction = 'like' and premium then 0
    when owner_reaction = 'like' and not coalesce(premium, false) then 1
    when owner_reaction = 'dislike' and premium then 3
    when owner_reaction = 'dislike' and not coalesce(premium, false) then 4
    else 2
  end;
$$;

-- Ad reactions are for monitoring. Nothing here changes campaign order or the active flag.
create table if not exists public.ad_reactions (
  campaign_id uuid not null references public.ad_campaigns (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike', 'share', 'repost', 'quote')),
  created_at timestamptz not null default now(),
  primary key (campaign_id, user_id, reaction)
);
alter table public.ad_reactions enable row level security;
drop policy if exists "ad reactions: read" on public.ad_reactions;
create policy "ad reactions: read" on public.ad_reactions for select to authenticated using (true);
drop policy if exists "ad reactions: write own" on public.ad_reactions;
create policy "ad reactions: write own" on public.ad_reactions
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "ad reactions: delete own" on public.ad_reactions;
create policy "ad reactions: delete own" on public.ad_reactions
  for delete to authenticated using (user_id = (select auth.uid()));
create index if not exists ad_reactions_campaign_idx on public.ad_reactions (campaign_id);

-- ---------------------------------------------------------------------
-- Public anonymous groups. Premium creates. Anyone can join.
-- ---------------------------------------------------------------------
create table if not exists public.anonymous_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null check (char_length(name) between 2 and 80),
  about text check (char_length(about) <= 500),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.anonymous_groups enable row level security;
drop policy if exists "anon groups: read" on public.anonymous_groups;
create policy "anon groups: read" on public.anonymous_groups for select to authenticated using (true);
drop policy if exists "anon groups: premium creates" on public.anonymous_groups;
create policy "anon groups: premium creates" on public.anonymous_groups
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.blue_tick
    )
  );

create table if not exists public.anonymous_group_members (
  group_id uuid not null references public.anonymous_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.anonymous_group_members enable row level security;
drop policy if exists "anon members: read" on public.anonymous_group_members;
create policy "anon members: read" on public.anonymous_group_members for select to authenticated using (true);
drop policy if exists "anon members: join" on public.anonymous_group_members;
create policy "anon members: join" on public.anonymous_group_members
  for insert to authenticated with check (user_id = (select auth.uid()));
create index if not exists anonymous_group_members_user_idx on public.anonymous_group_members (user_id);

create table if not exists public.anonymous_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.anonymous_groups (id) on delete cascade,
  sender uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.anonymous_messages enable row level security;
drop policy if exists "anon messages: read" on public.anonymous_messages;
create policy "anon messages: read" on public.anonymous_messages for select to authenticated using (true);
drop policy if exists "anon messages: premium sends" on public.anonymous_messages;
create policy "anon messages: premium sends" on public.anonymous_messages
  for insert to authenticated with check (
    sender = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.blue_tick
    )
    and exists (
      select 1 from public.anonymous_group_members m
      where m.group_id = group_id and m.user_id = (select auth.uid())
    )
  );
create index if not exists anonymous_messages_group_idx on public.anonymous_messages (group_id, created_at);

-- ---------------------------------------------------------------------
-- Complaints, content reports, and withdrawal requests for Admin
-- ---------------------------------------------------------------------
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);
alter table public.complaints enable row level security;
drop policy if exists "complaints: read own" on public.complaints;
create policy "complaints: read own" on public.complaints
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "complaints: write own" on public.complaints;
create policy "complaints: write own" on public.complaints
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'open');
create index if not exists complaints_user_idx on public.complaints (user_id, created_at desc);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 80),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  created_at timestamptz not null default now()
);
alter table public.content_reports enable row level security;
drop policy if exists "content reports: read own" on public.content_reports;
create policy "content reports: read own" on public.content_reports
  for select to authenticated using (reporter = (select auth.uid()));
drop policy if exists "content reports: write own" on public.content_reports;
create policy "content reports: write own" on public.content_reports
  for insert to authenticated with check (reporter = (select auth.uid()) and status = 'open');
create index if not exists content_reports_target_idx on public.content_reports (target_type, target_id);
create index if not exists content_reports_reporter_idx on public.content_reports (reporter);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  region text not null check (region in ('nigeria', 'africa', 'foreign')),
  amount numeric not null check (amount > 0),
  currency text not null check (currency in ('NGN', 'USD')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.withdrawal_requests enable row level security;
drop policy if exists "withdrawals: read own" on public.withdrawal_requests;
create policy "withdrawals: read own" on public.withdrawal_requests
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "withdrawals: request own" on public.withdrawal_requests;
create policy "withdrawals: request own" on public.withdrawal_requests
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');
create index if not exists withdrawal_requests_user_idx on public.withdrawal_requests (user_id, created_at desc);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests (status, created_at desc);

create or replace function public.enforce_withdrawal_minimum()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_region text;
begin
  select region into v_region from public.profiles where id = new.user_id;
  if v_region is null then
    raise exception 'Set a region before withdrawing' using errcode = 'check_violation';
  end if;
  if new.region is distinct from v_region then
    raise exception 'Withdrawal region must match the profile' using errcode = 'check_violation';
  end if;
  if v_region = 'nigeria' and (new.currency <> 'NGN' or new.amount < 30000) then
    raise exception 'Minimum withdrawal for Nigerians is ₦30,000' using errcode = 'check_violation';
  elsif v_region = 'africa' and (new.currency <> 'NGN' or new.amount < 50000) then
    raise exception 'Minimum withdrawal for other Africans is ₦50,000' using errcode = 'check_violation';
  elsif v_region = 'foreign' and (new.currency <> 'USD' or new.amount < 50) then
    raise exception 'Minimum withdrawal is $50' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT' and new.status <> 'pending' then
    raise exception 'New withdrawals wait for Admin' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_withdrawal_minimum on public.withdrawal_requests;
create trigger enforce_withdrawal_minimum
  before insert or update on public.withdrawal_requests
  for each row execute function public.enforce_withdrawal_minimum();

alter table public.secret_videos add column if not exists caption text;
alter table public.secret_videos drop constraint if exists secret_videos_caption_check;
alter table public.secret_videos add constraint secret_videos_caption_check
  check (caption is null or char_length(caption) <= 280);

grant select, insert on public.post_views to authenticated;
grant select, insert, delete on public.post_dislikes to authenticated;
grant select, insert, update, delete on public.comment_reactions to authenticated;
grant select, insert, delete on public.ad_reactions to authenticated;
grant select, insert on public.anonymous_groups to authenticated;
grant select, insert on public.anonymous_group_members to authenticated;
grant select, insert on public.anonymous_messages to authenticated;
grant select, insert on public.complaints to authenticated;
grant select, insert on public.content_reports to authenticated;
grant select, insert on public.withdrawal_requests to authenticated;
grant execute on function public.comment_tier(text, boolean) to authenticated;
