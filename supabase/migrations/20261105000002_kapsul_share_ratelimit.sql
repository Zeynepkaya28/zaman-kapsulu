-- Faz 2: paylaşım sayfası + IP başına dakikada 3 kapsül sınırı
alter table public.kapsul_capsules add column if not exists ip_hash text;
create index if not exists kapsul_capsules_ip_idx on public.kapsul_capsules (ip_hash, created_at);

create or replace function public.kapsul_get(p_id uuid)
returns table (id uuid, nickname text, mood text, unlock_at timestamptz, created_at timestamptz, is_open boolean, message text)
language sql stable security definer set search_path = public as $$
  select c.id, c.nickname, c.mood, c.unlock_at, c.created_at,
         (c.unlock_at <= now()),
         case when c.unlock_at <= now() then c.message else null end
  from public.kapsul_capsules c where c.id = p_id;
$$;

create or replace function public.kapsul_create(p_nickname text, p_message text, p_mood text, p_unlock_at timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; v_ip text; v_hash text; v_recent int;
begin
  if p_unlock_at < now() + interval '1 minute' then raise exception 'Açılış zamanı en az 1 dakika sonra olmalı'; end if;
  if p_unlock_at > now() + interval '10 years' then raise exception 'En fazla 10 yıl sonrası seçilebilir'; end if;
  v_ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  if v_ip <> '' then
    v_hash := md5(v_ip || 'kapsul-salt');
    select count(*) into v_recent from public.kapsul_capsules
      where ip_hash = v_hash and created_at > now() - interval '1 minute';
    if v_recent >= 3 then raise exception 'Çok hızlısın: dakikada en fazla 3 kapsül bırakabilirsin'; end if;
  end if;
  insert into public.kapsul_capsules (nickname, message, mood, unlock_at, ip_hash)
  values (trim(p_nickname), trim(p_message), coalesce(nullif(p_mood,''),'✨'), p_unlock_at, v_hash)
  returning id into new_id;
  return new_id;
end; $$;

revoke all on function public.kapsul_get(uuid) from public;
grant execute on function public.kapsul_get(uuid) to anon, authenticated;
revoke all on function public.kapsul_create(text,text,text,timestamptz) from public;
grant execute on function public.kapsul_create(text,text,text,timestamptz) to anon, authenticated;
