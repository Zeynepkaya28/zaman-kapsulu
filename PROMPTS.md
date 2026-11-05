# Zaman Kapsülü — Promptlar

Bu uygulamayı yeniden üretmek ya da geliştirmek için kullanabileceğin promptlar.

## 1. Ana ürün promptu
> "Zaman Kapsülü" adında bir web uygulaması yap. Kullanıcı bir takma ad, en fazla 1000 karakterlik bir mesaj, bir ruh hali emojisi ve gelecekte bir açılış tarihi seçer. Mesaj o tarihe kadar sunucuda kilitli kalır; kimse (yazan bile) erken okuyamaz. Ana sayfada tüm kapsüllerin duvarı olsun: mühürlü olanlar koyu kartta, karartılmış metin ve canlı geri sayımla; açılanlar mesajıyla görünsün. Hepsi / Mühürlü / Açık filtreleri, +1 saat/gün/hafta/ay/yıl hızlı seçimleri ve üstte toplam/mühürlü/açık sayaçları olsun. Türkçe arayüz, sıcak kâğıt tonlu tasarım, karanlık mod desteği.

## 2. Backend / güvenlik promptu (Supabase)
> Supabase'de `kapsul_capsules` tablosu oluştur (id, nickname, message, mood, unlock_at, created_at). RLS açık olsun ve anon rolüne tabloya doğrudan erişim verilmesin. Okuma için `kapsul_list()` adında SECURITY DEFINER bir fonksiyon yaz: açılış zamanı geçmemiş kapsüllerin `message` alanını NULL döndürsün. Yazma için `kapsul_create()` fonksiyonu açılış zamanını 1 dakika ile 10 yıl arasında doğrulasın.

## 3. Frontend promptu
> Vite + React ile tek sayfa yaz. Supabase istemcisi `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` ortam değişkenlerini kullansın, veriye sadece `rpc('kapsul_list')` ve `rpc('kapsul_create')` ile erişsin. Geri sayım her saniye güncellensin; bir kapsülün süresi dolduğunda liste otomatik yeniden çekilsin ki mesaj ortaya çıksın.

## 4. Yayın promptu (Vercel)
> Projeyi Vercel'e Vite framework ayarıyla production olarak deploy et, ortam değişkenlerini ekle ve canlı URL'de kapsül oluşturup listelemenin çalıştığını doğrula.

## v1.1'de koda dönüşenler ✅
- **Paylaşılabilir link:** Her kapsülün `/k/:id` sayfası var (`kapsul_get` RPC + `vercel.json` rewrite). Kapsül oluşturulunca link otomatik kopyalanır / paylaşım menüsü açılır.
- **Spam sınırı:** `kapsul_create` IP'yi (hash'li) kontrol eder; dakikada en fazla 3 kapsül.
- **Benimkiler sekmesi:** Bu cihazdan bırakılan kapsüller işaretlenir ve ayrı sekmede listelenir (giriş gerektirmez).

## v1.2'de koda dönüşenler ✅
- **Hesaplar:** "Supabase Auth ile e-posta girişi ekle; 'Benimkiler' cihazdan bağımsız hesaba bağlansın." → magic link girişi, `kapsul_mine` / `kapsul_claim` RPC'leri; girişte bu cihazdaki kapsüller hesaba taşınır.

## v1.3'te koda dönüşenler ✅
- **Bildirim:** "Kapsül açıldığında e-posta bildirimi gönderen bir Supabase Edge Function + cron ekle." → `kapsul-notify` fonksiyonu, 5 dakikalık `pg_cron` işi, kartta "Açılınca haber ver". Göndermek için Supabase'e `RESEND_API_KEY` secret'ı eklenmeli.

## Sıradaki promptlar
- "Kapsül sayfaları için dinamik OG görseli üret."
