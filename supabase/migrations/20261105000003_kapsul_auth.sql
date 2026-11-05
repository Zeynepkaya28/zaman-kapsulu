-- Faz 3: hesaplar — kapsül sahibi, "Benimkiler" ve cihazdaki kapsülleri sahiplenme
alter table public.kapsul_capsules
  add column if not exists owner_id uuid references auth.users(id) on delete set null;
create index if not exists kapsul_capsules_owner_idx on public.kapsul_capsules (owner_id, created_at desc);

-- kapsul_create: giriş yapılmışsa sahibi yaz (anon ise null)
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
  insert into public.kapsul_capsules (nickname, message, mood, unlock_at, ip_hash, owner_id)
  values (trim(p_nickname), trim(p_message), coalesce(nullif(p_mood,''),'✨'), p_unlock_at, v_hash, auth.uid())
  returning id into new_id;
  return new_id;
end; $$;
revoke all on function public.kapsul_create(text,text,text,timestamptz) from public;
grant execute on function public.kapsul_create(text,text,text,timestamptz) to anon, authenticated;

-- kapsul_mine: yalnız çağıranın kapsülleri; açılmamışların mesajı yine gizli
create or replace function public.kapsul_mine()
returns table (id uuid, nickname text, mood text, unlock_at timestamptz, created_at timestamptz, is_open boolean, message text)
language sql stable security definer set search_path = public as $$
  select c.id, c.nickname, c.mood, c.unlock_at, c.created_at,
         (c.unlock_at <= now()),
         case when c.unlock_at <= now() then c.message else null end
  from public.kapsul_capsules c
  where auth.uid() is not null and c.owner_id = auth.uid()
  order by c.created_at desc limit 500;
$$;
revoke all on function public.kapsul_mine() from public, anon;
grant execute on function public.kapsul_mine() to authenticated;

-- kapsul_claim: cihazda kayıtlı, sahibi olmayan kapsülleri hesaba bağla
create or replace function public.kapsul_claim(p_ids uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if coalesce(array_length(p_ids, 1), 0) > 200 then raise exception 'En fazla 200 kapsül sahiplenilebilir'; end if;
  update public.kapsul_capsules set owner_id = auth.uid()
    where id = any(p_ids) and owner_id is null;
  get diagnostics v_count = row_count;
  return v_count;
end; $$;
revoke all on function public.kapsul_claim(uuid[]) from public, anon;
grant execute on function public.kapsul_claim(uuid[]) to authenticated;
