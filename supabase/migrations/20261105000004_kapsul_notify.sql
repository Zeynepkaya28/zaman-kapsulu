-- Faz 4: kapsül açılınca e-posta bildirimi
create extension if not exists pg_net with schema extensions;

alter table public.kapsul_capsules add column if not exists notified_at timestamptz;
-- zaten açılmış eski kapsüller için geriye dönük e-posta gitmesin
update public.kapsul_capsules set notified_at = now() where unlock_at <= now() and notified_at is null;
create index if not exists kapsul_capsules_due_idx on public.kapsul_capsules (unlock_at) where notified_at is null;

create table if not exists public.kapsul_watchers (
  capsule_id uuid not null references public.kapsul_capsules(id) on delete cascade,
  email text not null check (char_length(email) <= 254),
  created_at timestamptz not null default now(),
  unique (capsule_id, email)
);
alter table public.kapsul_watchers enable row level security;
revoke all on public.kapsul_watchers from anon, authenticated;

-- kapsul_watch: mühürlü bir kapsülü e-postayla takip et
create or replace function public.kapsul_watch(p_id uuid, p_email text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email)); v_count int; v_open boolean;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'Geçerli bir e-posta adresi gir';
  end if;
  select unlock_at <= now() into v_open from public.kapsul_capsules where id = p_id;
  if v_open is null then raise exception 'Kapsül bulunamadı'; end if;
  if v_open then raise exception 'Bu kapsül zaten açıldı'; end if;
  select count(*) into v_count from public.kapsul_watchers where capsule_id = p_id;
  if v_count >= 50 then raise exception 'Bu kapsülün takipçi sınırı doldu'; end if;
  insert into public.kapsul_watchers (capsule_id, email) values (p_id, v_email)
    on conflict (capsule_id, email) do nothing;
  return true;
end; $$;
revoke all on function public.kapsul_watch(uuid, text) from public;
grant execute on function public.kapsul_watch(uuid, text) to anon, authenticated;

-- kapsul_take_due: açılmış ve bildirilmemiş kapsülleri işaretleyip alıcılarıyla döndür (yalnız service_role)
create or replace function public.kapsul_take_due(p_limit int default 50)
returns table (id uuid, nickname text, mood text, unlock_at timestamptz, recipients text[])
language plpgsql security definer set search_path = public as $$
begin
  return query
  with due as (
    select c.id from public.kapsul_capsules c
    where c.notified_at is null and c.unlock_at <= now()
    order by c.unlock_at limit least(greatest(p_limit, 1), 50)
    for update skip locked
  ), marked as (
    update public.kapsul_capsules c set notified_at = now()
    from due where c.id = due.id
    returning c.id, c.nickname, c.mood, c.unlock_at, c.owner_id
  )
  select m.id, m.nickname, m.mood, m.unlock_at,
    array(
      select distinct e from (
        select u.email::text e from auth.users u where u.id = m.owner_id and u.email is not null
        union select w.email from public.kapsul_watchers w where w.capsule_id = m.id
      ) s
    )
  from marked m;
end; $$;
revoke all on function public.kapsul_take_due(int) from public, anon, authenticated;
grant execute on function public.kapsul_take_due(int) to service_role;

-- kapsul_due_count: bekleyen bildirim sayısı (anahtar yokken loglamak için, yalnız service_role)
create or replace function public.kapsul_due_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.kapsul_capsules where notified_at is null and unlock_at <= now();
$$;
revoke all on function public.kapsul_due_count() from public, anon, authenticated;
grant execute on function public.kapsul_due_count() to service_role;

-- her 5 dakikada Edge Function'ı çağır
select cron.unschedule('kapsul-notify') where exists (select 1 from cron.job where jobname = 'kapsul-notify');
select cron.schedule('kapsul-notify', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://tygzleyywkiwjxvrnprp.supabase.co/functions/v1/kapsul-notify',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
$cron$);
