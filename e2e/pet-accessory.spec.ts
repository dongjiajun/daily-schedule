import { test, expect } from '@playwright/test'

/**
 * 宠物装扮 E2E：配饰购买即装备（写入 current_accessory）、覆盖装备、取下幂等、quantity>1 拒绝。
 * fullyParallel 下每个测试使用独立用户（装备态互不干扰），不依赖执行顺序。
 */

type TestUser = { username: string; email: string; password: string }

function makeUser(prefix: string): TestUser {
  const ts = Date.now()
  return { username: `${prefix}_${ts}`, email: `${prefix}_${ts}@test.com`, password: 'test123456' }
}

let accessToken = ''
let currentUser: TestUser

function authHeaders() {
  return { Authorization: `Bearer ${accessToken}` }
}

async function ensureLoggedIn(page: Parameters<Parameters<typeof test>[1]>[0]['page'], user: TestUser) {
  currentUser = user
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('onboarding_done', '1'))
  const regResp = await page.request.post('/api/v1/auth/register', {
    data: { username: user.username, email: user.email, password: user.password }
  })
  if (regResp.status() === 201) {
    const data = await regResp.json()
    accessToken = data.accessToken
    await page.request.post('/api/v1/pets/me', {
      data: { species: 'ORANGE_CAT', name: '大橘' },
      headers: authHeaders()
    })
  } else {
    const loginResp = await page.request.post('/api/v1/auth/login', {
      data: { usernameOrEmail: user.username, password: user.password }
    })
    expect(loginResp.status()).toBe(200)
    accessToken = (await loginResp.json()).accessToken
  }
  await page.fill('input[placeholder="输入用户名或邮箱"]', user.username)
  await page.fill('input[placeholder="输入密码"]', user.password)
  await page.click('text=登录')
  await page.waitForURL('**/')
  await page.waitForTimeout(2000)
}

async function getPet(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  const resp = await page.request.get('/api/v1/pets/me', { headers: authHeaders() })
  expect(resp.status()).toBe(200)
  return resp.json()
}

async function findAccessory(page: Parameters<Parameters<typeof test>[1]>[0]['page'], name: string) {
  const resp = await page.request.get('/api/v1/shop/items', { headers: authHeaders() })
  const items = await resp.json()
  const item = items.find((i: { name: string; type: string }) => i.name === name && i.type === 'ACCESSORY')
  expect(item, `商店应包含配饰 ${name}`).toBeTruthy()
  return item.id as number
}

test.describe('Pet Accessory Equip', () => {
  test('购买配饰 → 装备成功（currentAccessory 写入 + equippedAccessoryId 回传）', async ({ page }) => {
    await ensureLoggedIn(page, makeUser('acc_equip'))
    const accessoryId = await findAccessory(page, '巫师帽')
    const before = await getPet(page)

    const resp = await page.request.post('/api/v1/shop/purchase', {
      headers: authHeaders(),
      data: { itemId: accessoryId, quantity: 1 }
    })
    expect(resp.status()).toBe(200)
    const result = await resp.json()
    expect(result.success).toBe(true)
    expect(result.equippedAccessoryId).toBe(accessoryId)

    const after = await getPet(page)
    expect(after.currentAccessory).toBe(accessoryId)
    expect(after.coins).toBe(before.coins - 40) // 巫师帽 40 币
    expect(after.mood).toBe(before.mood)        // 纯外观不改数值
  })

  test('再购另一配饰 → 覆盖旧装备', async ({ page }) => {
    await ensureLoggedIn(page, makeUser('acc_overwrite'))
    const antlerId = await findAccessory(page, '麋鹿角')

    const resp = await page.request.post('/api/v1/shop/purchase', {
      headers: authHeaders(),
      data: { itemId: antlerId, quantity: 1 }
    })
    expect(resp.status()).toBe(200)

    const after = await getPet(page)
    expect(after.currentAccessory).toBe(antlerId)
  })

  test('配饰 quantity>1 → 400 拒绝且不装备', async ({ page }) => {
    await ensureLoggedIn(page, makeUser('acc_reject'))
    const hatId = await findAccessory(page, '新年帽')
    const before = await getPet(page)

    const resp = await page.request.post('/api/v1/shop/purchase', {
      headers: authHeaders(),
      data: { itemId: hatId, quantity: 2 }
    })
    expect(resp.status()).toBe(400)

    const after = await getPet(page)
    expect(after.currentAccessory).toBe(before.currentAccessory)
  })

  test('取下配饰 → 204 且 currentAccessory 置 null（未装备时幂等）', async ({ page }) => {
    await ensureLoggedIn(page, makeUser('acc_unequip'))
    const earId = await findAccessory(page, '兔耳朵')
    await page.request.post('/api/v1/shop/purchase', {
      headers: authHeaders(),
      data: { itemId: earId, quantity: 1 }
    })

    const unequipResp = await page.request.delete('/api/v1/pets/me/accessory', { headers: authHeaders() })
    expect(unequipResp.status()).toBe(204)
    const after = await getPet(page)
    expect(after.currentAccessory).toBeNull()

    // 未装备时再取下 → 仍 204（幂等）
    const again = await page.request.delete('/api/v1/pets/me/accessory', { headers: authHeaders() })
    expect(again.status()).toBe(204)
  })

  test('装备后详情页渲染装扮叠加层（视觉集成）', async ({ page }) => {
    await ensureLoggedIn(page, makeUser('acc_visual'))
    const hatId = await findAccessory(page, '巫师帽')
    await page.request.post('/api/v1/shop/purchase', {
      headers: authHeaders(),
      data: { itemId: hatId, quantity: 1 }
    })

    // 进入 /pet 详情页：大 PetAvatar 应渲染基础插画 + 装扮叠加层两个 SVG
    await page.goto('/pet')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const avatar = page.locator('[aria-label^="宠物状态"]').first()
    await expect(avatar).toBeVisible({ timeout: 5000 })
    await expect(avatar.locator('svg')).toHaveCount(2)

    // 点击 PetPage「取下」按钮 → 叠加层消失（仅剩基础插画，无需手动 reload）
    await page.getByRole('button', { name: '取下' }).click()
    await expect(avatar.locator('svg')).toHaveCount(1, { timeout: 5000 })
  })
})
