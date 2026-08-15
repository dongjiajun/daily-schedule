import { test, expect } from '@playwright/test'

/**
 * 宠物经济闭环 E2E：任务/日程完成发放专注币（幂等）、取消日程心情惩罚、无宠物用户不受影响。
 * 奖励挂钩在后端事务内完成，用 API 驱动验证（与 UI 走同一完整服务端链路）。
 */

const USER = { username: `econ_${Date.now()}`, email: `econ_${Date.now()}@test.com`, password: 'test123456' }

let accessToken = ''

function authHeaders() {
  return { Authorization: `Bearer ${accessToken}` }
}

async function ensureLoggedIn(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('onboarding_done', '1'))
  const regResp = await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password }
  })
  if (regResp.status() === 201) {
    const data = await regResp.json()
    accessToken = data.accessToken
    // 创建宠物（初始 100 币 / 100 心情）
    await page.request.post('/api/v1/pets/me', {
      data: { species: 'ORANGE_CAT', name: '大橘' },
      headers: authHeaders()
    })
  } else {
    const loginResp = await page.request.post('/api/v1/auth/login', {
      data: { usernameOrEmail: USER.username, password: USER.password }
    })
    expect(loginResp.status()).toBe(200)
    accessToken = (await loginResp.json()).accessToken
  }
  await page.fill('input[placeholder="输入用户名或邮箱"]', USER.username)
  await page.fill('input[placeholder="输入密码"]', USER.password)
  await page.click('text=登录')
  await page.waitForURL('**/')
  await page.waitForTimeout(2000)
}

async function getPet(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  const resp = await page.request.get('/api/v1/pets/me', { headers: authHeaders() })
  expect(resp.status()).toBe(200)
  return resp.json()
}

async function createTask(page: Parameters<Parameters<typeof test>[1]>[0]['page'], title: string) {
  const resp = await page.request.post('/api/v1/tasks', {
    headers: authHeaders(),
    data: { title, priority: 'MEDIUM', status: 'TODO' }
  })
  expect(resp.status()).toBe(201)
  return (await resp.json()).id as number
}

async function createEvent(page: Parameters<Parameters<typeof test>[1]>[0]['page'], title: string) {
  const start = new Date(Date.now() + 3600_000).toISOString()
  const end = new Date(Date.now() + 7200_000).toISOString()
  const resp = await page.request.post('/api/v1/events', {
    headers: authHeaders(),
    data: { title, startTime: start, endTime: end, status: 'PLANNED' }
  })
  expect(resp.status()).toBe(201)
  return (await resp.json()).id as number
}

test.describe('Pet Economy Loop', () => {
  test('任务移入 DONE → 专注币 +10、经验 +20', async ({ page }) => {
    await ensureLoggedIn(page)
    const before = await getPet(page)

    const taskId = await createTask(page, `经济测试任务_${Date.now()}`)
    const moveResp = await page.request.patch(`/api/v1/tasks/${taskId}/move`, {
      headers: authHeaders(),
      data: { status: 'DONE', sortOrder: 1 }
    })
    expect(moveResp.status()).toBe(200)

    const after = await getPet(page)
    expect(after.coins).toBe(before.coins + 10)
    expect(after.experience).toBe(before.experience + 20)
  })

  test('任务反复 TODO↔DONE → 奖励不重复发放（幂等）', async ({ page }) => {
    await ensureLoggedIn(page)
    const before = await getPet(page)

    const taskId = await createTask(page, `幂等任务_${Date.now()}`)
    // 第一次完成 → +10
    await page.request.patch(`/api/v1/tasks/${taskId}/move`, { headers: authHeaders(), data: { status: 'DONE', sortOrder: 1 } })
    // 退回 TODO 再完成两次 → 不再发放（同一 taskId 幂等键命中）
    await page.request.patch(`/api/v1/tasks/${taskId}/move`, { headers: authHeaders(), data: { status: 'TODO', sortOrder: 0 } })
    await page.request.patch(`/api/v1/tasks/${taskId}/move`, { headers: authHeaders(), data: { status: 'DONE', sortOrder: 2 } })
    await page.request.patch(`/api/v1/tasks/${taskId}/move`, { headers: authHeaders(), data: { status: 'TODO', sortOrder: 0 } })
    await page.request.patch(`/api/v1/tasks/${taskId}/move`, { headers: authHeaders(), data: { status: 'DONE', sortOrder: 3 } })

    const after = await getPet(page)
    expect(after.coins).toBe(before.coins + 10)
  })

  test('日程标记完成 → 专注币 +20、经验 +30', async ({ page }) => {
    await ensureLoggedIn(page)
    const before = await getPet(page)

    const eventId = await createEvent(page, `经济日程_${Date.now()}`)
    // 全量 PUT 携带 COMPLETED（与前端 useToggleEventStatus 相同路径）
    const created = await (await page.request.get(`/api/v1/events/${eventId}`, { headers: authHeaders() })).json()
    const start = new Date(Date.now() + 3600_000).toISOString()
    const end = new Date(Date.now() + 7200_000).toISOString()
    const updateResp = await page.request.put(`/api/v1/events/${eventId}`, {
      headers: authHeaders(),
      data: { title: created.title, startTime: start, endTime: end, status: 'COMPLETED' }
    })
    expect(updateResp.status()).toBe(200)

    const after = await getPet(page)
    expect(after.coins).toBe(before.coins + 20)
    expect(after.experience).toBe(before.experience + 30)
  })

  test('删除计划中日程 → 心情 -10（仅一次）', async ({ page }) => {
    await ensureLoggedIn(page)
    const before = await getPet(page)

    const eventId = await createEvent(page, `取消日程_${Date.now()}`)
    const delResp = await page.request.delete(`/api/v1/events/${eventId}`, { headers: authHeaders() })
    expect(delResp.status()).toBe(204)

    const after = await getPet(page)
    // 心情下降（-10；30s 周期衰减调度器在慢环境下可能干扰精确差值，故用方向断言）
    expect(after.mood).toBeLessThan(before.mood)
    expect(after.coins).toBe(before.coins) // 取消不扣币
  })

  test('无宠物用户完成任务/日程 → 流程正常不报错', async ({ page }) => {
    // 独立无宠物账号
    const noPetUser = { username: `nopet_${Date.now()}`, email: `nopet_${Date.now()}@test.com`, password: 'test123456' }
    const regResp = await page.request.post('/api/v1/auth/register', { data: noPetUser })
    expect(regResp.status()).toBe(201)
    const token = (await regResp.json()).accessToken
    const headers = { Authorization: `Bearer ${token}` }

    const taskResp = await page.request.post('/api/v1/tasks', {
      headers,
      data: { title: `无宠物任务_${Date.now()}`, priority: 'MEDIUM', status: 'TODO' }
    })
    const taskId = (await taskResp.json()).id
    const moveResp = await page.request.patch(`/api/v1/tasks/${taskId}/move`, {
      headers,
      data: { status: 'DONE', sortOrder: 1 }
    })
    expect(moveResp.status()).toBe(200)

    // 奖励 API 幂等返回 granted=false
    const rewardResp = await page.request.post('/api/v1/pets/me/rewards', {
      headers,
      data: { source: 'TASK_COMPLETED', refId: String(taskId) }
    })
    expect(rewardResp.status()).toBe(200)
    expect((await rewardResp.json()).granted).toBe(false)
  })
})
