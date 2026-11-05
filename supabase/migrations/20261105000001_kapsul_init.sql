-- Faz 1: tablo + güvenli RPC'ler
create table if not exists public.kapsul_capsules (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 40),
  message text not null check (char_length(message) between 1 and 1000),
  mood text not null default '✨' check (char_length(mood) <= 8),
  unlock_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (unlock_at > created_at)
);
create index if not exists kapsul_capsules_unlock_idx on public.kapsul_capsules (unlock_at);
alter table public.kapsul_capsules enable row level security;
revoke all on public.kapsul_capsules from anon, authenticated;

create or replace function public.kapsul_list()
returns table (id uuid, nickname text, mood text, unlock_at timestamptz, created_at timestamptz, is_open boolean, message text)
language sql stable security definer set search_path = public as $$
  select c.id, c.nickname, c.mood, c.unlock_at, c.created_at,
         (c.unlock_at <= now()),
         case when c.unlock_at <= now() then c.message else null end
  from public.kapsul_capsules c order by c.created_at desc limit 200;
$$;
revoke all on function public.kapsul_list() from public;
grant execute on function public.kapsul_list() to anon, authenticated;
