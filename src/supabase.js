import { createClient } from '@supabase/supabase-js'

// Publishable anahtar herkese açık olacak şekilde tasarlanmıştır (erişim RLS + RPC ile korunur).
// Ortam değişkeni yoksa (CI, Git tabanlı deploy) bu varsayılanlar kullanılır.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tygzleyywkiwjxvrnprp.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_gD5zk0bRPCZC0_OK3vqSsQ_UzC83ZxT'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
