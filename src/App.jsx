import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'

const MOODS = ['✨', '💌', '🌱', '🔥', '🌙', '🎯', '🫶', '🚀']
const PRESETS = [
  { label: '1 saat', ms: 3600e3 },
  { label: '1 gün', ms: 86400e3 },
  { label: '1 hafta', ms: 7 * 86400e3 },
  { label: '1 ay', ms: 30 * 86400e3 },
  { label: '1 yıl', ms: 365 * 86400e3 },
]

function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function countdown(ms) {
  if (ms <= 0) return 'açılıyor…'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60), sec = s % 60
  if (d > 0) return `${d}g ${h}s ${m}dk`
  if (h > 0) return `${h}s ${m}dk ${sec}sn`
  return `${m}dk ${sec}sn`
}

const MINE_KEY = 'kapsul_mine'
function readMine() {
  try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') } catch { return [] }
}
function addMine(id) {
  try { localStorage.setItem(MINE_KEY, JSON.stringify([id, ...readMine()].slice(0, 200))) } catch {}
}
const shareUrl = (id) => `${location.origin}/k/${id}`
async function share(id) {
  const url = shareUrl(id)
  try {
    if (navigator.share) { await navigator.share({ title: 'Zaman Kapsülü', url }); return 'Paylaşıldı' }
    await navigator.clipboard.writeText(url); return 'Link kopyalandı'
  } catch { return url }
}

const fmt = (iso) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

function useSession() {
  const [session, setSession] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}

function AuthBar({ session }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')
  const [err, setErr] = useState('')
  if (session) {
    return (
      <div className="authbar">
        <span className="who" title={session.user.email}>{session.user.email}</span>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>Çıkış</button>
      </div>
    )
  }
  async function send(e) {
    e.preventDefault()
    setState('sending'); setErr('')
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { emailRedirectTo: location.origin + location.pathname },
    })
    if (error) { setErr(error.message); setState('idle') } else setState('sent')
  }
  return (
    <div className="authbar">
      {!open && <button className="ghost" onClick={() => setOpen(true)}>Giriş yap</button>}
      {open && state !== 'sent' && (
        <form className="authform" onSubmit={send}>
          <input type="email" required autoFocus value={email} placeholder="e-posta adresin"
            aria-label="E-posta adresi" onChange={(e) => setEmail(e.target.value)} />
          <button className="ghost" disabled={state === 'sending'}>
            {state === 'sending' ? 'Gönderiliyor…' : 'Link gönder'}
          </button>
          <button type="button" className="ghost" aria-label="Vazgeç" onClick={() => setOpen(false)}>✕</button>
        </form>
      )}
      {state === 'sent' && <span className="who">Giriş linki {email} adresine gönderildi.</span>}
      {err && <span className="err small">{err}</span>}
    </div>
  )
}

function WatchForm({ id }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')
  const [err, setErr] = useState('')
  if (state === 'done') return <p className="watchok">Açılınca {email} adresine haber vereceğiz.</p>
  if (!open) return <button className="watchbtn" onClick={() => setOpen(true)}>🔔 Açılınca haber ver</button>
  async function send(e) {
    e.preventDefault()
    setState('sending'); setErr('')
    const { error } = await supabase.rpc('kapsul_watch', { p_id: id, p_email: email })
    if (error) { setErr(error.message); setState('idle') } else setState('done')
  }
  return (
    <form className="watchform" onSubmit={send}>
      <input type="email" required autoFocus value={email} placeholder="e-posta adresin"
        aria-label="Bildirim için e-posta adresi" onChange={(e) => setEmail(e.target.value)} />
      <button disabled={state === 'sending'}>{state === 'sending' ? '…' : 'Kaydet'}</button>
      {err && <span className="watcherr">{err}</span>}
    </form>
  )
}

function Capsule({ c, now, onShare, mine }) {
  const left = new Date(c.unlock_at).getTime() - now
  const total = new Date(c.unlock_at) - new Date(c.created_at)
  const pct = c.is_open ? 100 : Math.min(100, Math.max(0, 100 - (left / total) * 100))
  return (
    <article className={c.is_open ? 'cap open' : 'cap sealed'}>
      <div className="caphead">
        <span className="mo">{c.mood}</span>
        <span className="nick">{c.nickname}{mine && <em className="mine"> · senin</em>}</span>
        <span className="state">{c.is_open ? 'Açık' : '🔒'}</span>
      </div>
      {c.is_open
        ? <p className="msg">{c.message}</p>
        : <p className="msg locked">{'█'.repeat(18)}<br />{'█'.repeat(11)}</p>}
      <div className="bar"><i style={{ width: pct + '%' }} /></div>
      <div className="meta">
        <span>{c.is_open ? <>Açıldı · {fmt(c.unlock_at)}</> : <>Açılmasına <b>{countdown(left)}</b></>}</span>
        <button className="share" onClick={() => onShare(c.id)} aria-label="Paylaş">↗ Paylaş</button>
      </div>
      {!c.is_open && <WatchForm id={c.id} />}
    </article>
  )
}

function SinglePage({ id }) {
  const [c, setC] = useState(null)
  const [state, setState] = useState('loading')
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState('')
  async function load() {
    const { data, error } = await supabase.rpc('kapsul_get', { p_id: id })
    if (error || !data?.length) { setState('missing'); return }
    setC(data[0]); setState('ok')
  }
  useEffect(() => { load() }, [id])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { if (c && !c.is_open && new Date(c.unlock_at).getTime() <= now) load() }, [now, c])
  const onShare = async (cid) => { setToast(await share(cid)); setTimeout(() => setToast(''), 3000) }
  return (
    <div className="wrap single">
      <a className="back" href="/">← Tüm kapsüller</a>
      {state === 'loading' && <p className="muted">Yükleniyor…</p>}
      {state === 'missing' && <p className="muted">Bu kapsül bulunamadı.</p>}
      {state === 'ok' && <>
        <h1 className="singletitle">{c.is_open ? 'Kapsül açıldı.' : 'Bu kapsül hâlâ mühürlü.'}</h1>
        <p className="lead">{c.is_open ? `${c.nickname} bunu ${fmt(c.created_at)} tarihinde yazmıştı.` : `${fmt(c.unlock_at)} tarihinde açılacak. Linki sakla, o gün geri dön.`}</p>
        <div className="singlecard"><Capsule c={c} now={now} onShare={onShare} mine={readMine().includes(c.id)} /></div>
      </>}
      <a className="primary cta" href="/">Sen de bir kapsül bırak</a>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default function App() {
  const m = location.pathname.match(/^\/k\/([0-9a-f-]{36})\/?$/i)
  return m ? <SinglePage id={m[1]} /> : <Wall />
}

function Wall() {
  const [capsules, setCapsules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [filter, setFilter] = useState('all')

  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [mood, setMood] = useState('✨')
  const [unlockAt, setUnlockAt] = useState(toLocalInput(new Date(Date.now() + 86400e3)))
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [localMine, setLocalMine] = useState(readMine)
  const [myCaps, setMyCaps] = useState([])
  const session = useSession()
  const userId = session?.user?.id

  async function load() {
    const { data, error } = await supabase.rpc('kapsul_list')
    if (error) setError(error.message)
    else { setCapsules(data || []); setError('') }
    setLoading(false)
    if (userId) loadMine()
  }
  async function loadMine() {
    const { data } = await supabase.rpc('kapsul_mine')
    setMyCaps(data || [])
  }

  useEffect(() => { load() }, [])
  // giriş yapılınca bu cihazdaki kapsülleri hesaba bağla, sonra hesabın kapsüllerini çek
  useEffect(() => {
    if (!userId) { setMyCaps([]); return }
    (async () => {
      const ids = readMine()
      if (ids.length) await supabase.rpc('kapsul_claim', { p_ids: ids })
      loadMine()
    })()
  }, [userId])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  // a capsule just crossed its unlock time → refetch to get its message
  useEffect(() => {
    const due = [...capsules, ...myCaps].some((c) => !c.is_open && new Date(c.unlock_at).getTime() <= now)
    if (due) load()
  }, [now, capsules, myCaps])

  async function submit(e) {
    e.preventDefault()
    setSending(true); setError('')
    const { data: newId, error } = await supabase.rpc('kapsul_create', {
      p_nickname: nickname, p_message: message, p_mood: mood,
      p_unlock_at: new Date(unlockAt).toISOString(),
    })
    setSending(false)
    if (error) { setError(error.message); return }
    setMessage('')
    addMine(newId); setLocalMine(readMine())
    const msg = await share(newId)
    setToast(`Kapsül mühürlendi. ${msg === 'Link kopyalandı' ? 'Linki kopyalandı, sakla.' : ''}`)
    setTimeout(() => setToast(''), 4000)
    load()
  }

  const stats = useMemo(() => {
    const open = capsules.filter((c) => c.is_open).length
    return { total: capsules.length, open, sealed: capsules.length - open }
  }, [capsules])

  // oturum varsa "Benimkiler" hesaptan gelir (her cihazda aynı), yoksa bu cihazın listesinden
  const mine = userId ? myCaps.map((c) => c.id) : localMine
  const shown = filter === 'mine'
    ? (userId ? myCaps : capsules.filter((c) => localMine.includes(c.id)))
    : capsules.filter((c) => filter === 'all' ? true : filter === 'open' ? c.is_open : !c.is_open)
  const onShare = async (id) => { setToast(await share(id)); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="wrap">
      <header className="hero">
        <div className="topbar">
          <div className="badge">⏳ Zaman Kapsülü</div>
          <AuthBar session={session} />
        </div>
        <h1>Bugünden geleceğe<br /><em>mühürlü</em> bir not bırak.</h1>
        <p className="lead">
          Yazdığın not, seçtiğin ana kadar kilitli kalır. O an geldiğinde herkes için açılır.
          Kimse, sen bile, erken okuyamaz.
        </p>
        <div className="stats">
          <div><b>{stats.total}</b><span>kapsül</span></div>
          <div><b>{stats.sealed}</b><span>mühürlü</span></div>
          <div><b>{stats.open}</b><span>açıldı</span></div>
        </div>
      </header>

      <form className="card form" onSubmit={submit}>
        <h2>Yeni kapsül</h2>
        <label>
          Takma ad
          <input value={nickname} maxLength={40} required placeholder="ör. gececi"
            onChange={(e) => setNickname(e.target.value)} />
        </label>
        <label>
          Mesaj
          <textarea value={message} maxLength={1000} required rows={4}
            placeholder="Bir yıl sonraki kendine ne söylemek isterdin?"
            onChange={(e) => setMessage(e.target.value)} />
          <small>{message.length}/1000</small>
        </label>
        <div className="row">
          <span className="lbl">Ruh hali</span>
          <div className="moods">
            {MOODS.map((m) => (
              <button type="button" key={m} className={m === mood ? 'mood on' : 'mood'}
                onClick={() => setMood(m)} aria-label={`ruh hali ${m}`}>{m}</button>
            ))}
          </div>
        </div>
        <label>
          Açılış zamanı
          <input type="datetime-local" value={unlockAt} required
            onChange={(e) => setUnlockAt(e.target.value)} />
        </label>
        <div className="presets">
          {PRESETS.map((p) => (
            <button type="button" key={p.label}
              onClick={() => setUnlockAt(toLocalInput(new Date(Date.now() + p.ms)))}>
              +{p.label}
            </button>
          ))}
        </div>
        <button className="primary" disabled={sending}>
          {sending ? 'Mühürleniyor…' : 'Kapsülü mühürle 🔒'}
        </button>
        {error && <p className="err">{error}</p>}
      </form>

      <section>
        <div className="listhead">
          <h2>Duvar</h2>
          <div className="tabs">
            {[['all', 'Hepsi'], ['sealed', 'Mühürlü'], ['open', 'Açık'], ['mine', 'Benimkiler']].map(([k, l]) => (
              <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        {loading ? <p className="muted">Yükleniyor…</p> :
          shown.length === 0 ? <p className="muted">{filter === 'mine' ? (userId ? 'Hesabında henüz kapsül yok.' : 'Bu cihazdan bıraktığın kapsül yok. Giriş yaparsan kapsüllerin her cihazda görünür.') :'Henüz kapsül yok. İlkini sen bırak.'}</p> :
          <div className="grid">
            {shown.map((c) => <Capsule key={c.id} c={c} now={now} onShare={onShare} mine={mine.includes(c.id)} />)}
          </div>}
      </section>

      <footer>Supabase + Vercel ile çalışır · Mesajlar açılış anına kadar sunucuda kilitli tutulur.</footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
