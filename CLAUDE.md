# Zaman Kapsülü — Claude Code proje rehberi

Kullanıcıların geleceğe mühürlü notlar bıraktığı Türkçe web uygulaması. Not, seçilen açılış anına kadar
sunucuda kilitli kalır; o an gelince herkes için açılır.

- **Canlı:** https://zaman-kapsulu-three.vercel.app
- **Vercel projesi:** `zaman-kapsulu` (`prj_2Ou9ru1e50fQOdADoZ9jXyaiLd6b`, takım `zeynep-beca`)
- **Supabase projesi:** `smartgrid-pulse` (`tygzleyywkiwjxvrnprp`). Uygulamanın tüm nesneleri `kapsul_` önekli.
  Aynı veritabanında başka bir uygulamanın tabloları (telemetry, devices, alerts…) var — **onlara dokunma.**

## Yetki ve çalışma şekli
Kullanıcı (Zeynep) bu projede tam yetki verdi: soru sormadan karar ver, uygula, test et, deploy et.
Belirsiz durumda makul olanı seç ve sonunda kısaca ne varsaydığını yaz. Kullanıcıyla Türkçe konuş.

## Teknoloji
- Vite 5 + React 18 (tek sayfa, `src/App.jsx`), saf CSS (`src/styles.css`, açık/koyu tema token'ları)
- `@supabase/supabase-js` — istemci `src/supabase.js`, anahtarlar `.env` içinde (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; publishable anahtar herkese açık olabilir)
- Yönlendirme: `location.pathname` ile `/k/:id`; Vercel tarafında `vercel.json` rewrite

## Komutlar
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/
npm test          # Vitest birim testleri
npm run test:e2e  # Playwright (ilk sefer: npx playwright install chromium)
npx vercel --prod # deploy (Vite framework)
```

## Güvenlik modeli (bozma!)
- `kapsul_capsules` tablosunda RLS açık ve anon/authenticated rolünün **hiçbir doğrudan yetkisi yok**.
- Tüm erişim `SECURITY DEFINER` RPC'lerle: `kapsul_list()`, `kapsul_get(id)`, `kapsul_create(...)`.
- Açılmamış kapsülün `message` alanı RPC'lerde her zaman `NULL` döner. Yeni bir okuma yolu eklerken bu kuralı koru.
- Şema değişikliği = `supabase/migrations/` altına yeni, tarihli bir SQL dosyası + Supabase'e uygula. Sonra güvenlik advisor'larını kontrol et.

## Fazlar
Yol haritası `docs/PHASES.md` içinde. Her faz bir slash komutu:
`/faz-3-auth`, `/faz-4-bildirim`, `/faz-5-cilalama`, `/faz-6-kalite`. Bir fazı bitirince `docs/PHASES.md`'de işaretle.

## Bitti tanımı (her faz için)
1. `npm run build` hatasız
2. Yeni SQL fonksiyonları anon rolüyle test edildi (`set local role anon;` + rollback)
3. Arayüz Playwright ile en az bir kez açılıp ekran görüntüsüyle kontrol edildi
4. Vercel'e production deploy + deploy durumu READY
5. `docs/PHASES.md` ve `PROMPTS.md` güncellendi
