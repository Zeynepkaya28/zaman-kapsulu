import { test, expect } from '@playwright/test'

const SEALED = {
  id: '11111111-1111-4111-8111-111111111111', nickname: 'gececi', mood: '🌙',
  unlock_at: new Date(Date.now() + 3 * 86400e3).toISOString(),
  created_at: new Date(Date.now() - 86400e3).toISOString(), is_open: false, message: null,
}
const OPEN = {
  id: '22222222-2222-4222-8222-222222222222', nickname: 'sabahçı', mood: '💌',
  unlock_at: new Date(Date.now() - 3600e3).toISOString(),
  created_at: new Date(Date.now() - 7 * 86400e3).toISOString(), is_open: true, message: 'Merhaba gelecek!',
}
const NEW_ID = '33333333-3333-4333-8333-333333333333'

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function mockSupabase(page, overrides = {}) {
  const calls = []
  await page.route('**/rest/v1/rpc/*', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()
    const body = route.request().postDataJSON?.() ?? {}
    calls.push({ name, body })
    if (overrides[name]) return overrides[name](route, body)
    if (name === 'kapsul_list') return json(route, [SEALED, OPEN])
    if (name === 'kapsul_get') return json(route, [SEALED, OPEN].filter((c) => c.id === body.p_id))
    if (name === 'kapsul_create') return json(route, NEW_ID)
    if (name === 'kapsul_watch') return json(route, true)
    return json(route, { message: 'bilinmeyen rpc' }, 404)
  })
  return calls
}

test('duvar kapsülleri ve sayaçları gösterir, mühürlü mesaj gizli kalır', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/')
  await expect(page.getByText('gececi')).toBeVisible()
  await expect(page.getByText('Merhaba gelecek!')).toBeVisible()
  await expect(page.locator('.stats')).toContainText('2kapsül')
  await expect(page.locator('.cap.sealed')).toContainText('Açılmasına')
  await expect(page.locator('.cap.sealed .msg')).not.toContainText('Merhaba')
})

test('filtreler mühürlü ve açık kapsülleri ayırır', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Mühürlü', exact: true }).click()
  await expect(page.locator('.grid .cap')).toHaveCount(1)
  await expect(page.locator('.grid .cap')).toContainText('gececi')
  await page.getByRole('button', { name: 'Açık', exact: true }).click()
  await expect(page.locator('.grid .cap')).toHaveCount(1)
  await expect(page.locator('.grid .cap')).toContainText('sabahçı')
  await page.getByRole('button', { name: 'Benimkiler' }).click()
  await expect(page.getByText('Bu cihazdan bıraktığın kapsül yok')).toBeVisible()
})

test('form kapsülü mühürler ve "Benimkiler"e ekler', async ({ page }) => {
  const calls = await mockSupabase(page)
  await page.goto('/')
  await page.getByLabel('Takma ad').fill('testçi')
  await page.getByLabel('Mesaj').fill('Bir yıl sonra oku')
  await page.getByRole('button', { name: 'ruh hali 🔥' }).click()
  await page.getByRole('button', { name: '+1 hafta' }).click()
  await page.getByRole('button', { name: /Kapsülü mühürle/ }).click()
  await expect(page.getByRole('status')).toContainText('Kapsül mühürlendi')
  const create = calls.find((c) => c.name === 'kapsul_create')
  expect(create.body).toMatchObject({ p_nickname: 'testçi', p_message: 'Bir yıl sonra oku', p_mood: '🔥' })
  const days = (new Date(create.body.p_unlock_at) - Date.now()) / 86400e3
  expect(days).toBeGreaterThan(6.9)
  expect(days).toBeLessThan(7.1)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kapsul_mine')))
  expect(stored).toContain(NEW_ID)
})

test('sunucu hatasında "Tekrar dene" listeyi yeniden çeker', async ({ page }) => {
  let fail = true
  await mockSupabase(page, {
    kapsul_list: (route) => (fail ? json(route, { message: 'boom' }, 500) : json(route, [OPEN])),
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Kapsüller yüklenemedi')
  fail = false
  await page.getByRole('button', { name: 'Tekrar dene' }).click()
  await expect(page.getByText('Merhaba gelecek!')).toBeVisible()
})

test('mühürlü kapsülde "Açılınca haber ver" e-postayı kaydeder', async ({ page }) => {
  const calls = await mockSupabase(page)
  await page.goto('/')
  await page.getByRole('button', { name: /Açılınca haber ver/ }).click()
  await page.getByLabel('Bildirim için e-posta adresi').fill('biri@example.com')
  await page.getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.getByText('biri@example.com adresine haber vereceğiz')).toBeVisible()
  expect(calls.find((c) => c.name === 'kapsul_watch').body).toEqual({ p_id: SEALED.id, p_email: 'biri@example.com' })
})

test('/k/:id mühürlü kapsül sayfası', async ({ page }) => {
  await mockSupabase(page)
  await page.goto(`/k/${SEALED.id}`)
  await expect(page.getByRole('heading', { name: 'Bu kapsül hâlâ mühürlü.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sen de bir kapsül bırak' })).toBeVisible()
})

test('/k/:id açık kapsül mesajı gösterir, bilinmeyen id "bulunamadı" der', async ({ page }) => {
  await mockSupabase(page)
  await page.goto(`/k/${OPEN.id}`)
  await expect(page.getByRole('heading', { name: 'Kapsül açıldı.' })).toBeVisible()
  await expect(page.getByText('Merhaba gelecek!')).toBeVisible()
  await page.goto('/k/99999999-9999-4999-8999-999999999999')
  await expect(page.getByText('Bu kapsül bulunamadı.')).toBeVisible()
})
