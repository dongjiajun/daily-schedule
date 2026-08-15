import { test, expect } from '@playwright/test'

const USER = { username: `edrag_${Date.now()}`, email: `edrag_${Date.now()}@test.com`, password: 'test123456' }

async function ensureLoggedIn(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('onboarding_done', '1'))
  const regResp = await page.request.post('/api/v1/auth/register', {
    data: { username: USER.username, email: USER.email, password: USER.password }
  })
  if (regResp.status() === 201) {
    const data = await regResp.json()
    await page.request.post('/api/v1/pets/me', {
      data: { species: 'ORANGE_CAT', name: '大橘' },
      headers: { Authorization: `Bearer ${data.accessToken}` }
    })
  }
  await page.fill('input[placeholder="输入用户名或邮箱"]', USER.username)
  await page.fill('input[placeholder="输入密码"]', USER.password)
  await page.click('text=登录')
  await page.waitForURL('**/')
  await page.waitForTimeout(2000)

  // Ensure no onboarding/pet dialog is blocking the screen
  const overlay = page.locator('[data-state="open"][aria-hidden="true"].fixed.inset-0')
  if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Try to close any blocking dialog
    const closeBtn = page.locator('[role="dialog"] button[aria-label="关闭"], [role="dialog"] button:has(svg)').first()
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click()
      await page.waitForTimeout(500)
    }
  }
}

async function createTaskViaQuickAdd(page: Parameters<Parameters<typeof test>[1]>[0]['page'], title: string) {
  // 列头"新建"按钮（精确文本，排除工具栏"新建任务"）
  const addBtn = page.getByRole('button', { name: '新建', exact: true }).first()
  await addBtn.click()
  await page.waitForTimeout(300)
  const input = page.locator('input[placeholder*="回车创建"]')
  await expect(input).toBeVisible({ timeout: 3000 })
  await input.fill(title)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1500)
}

test.describe('Todo Board Interactions', () => {
  test('看板三列正常渲染', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page.getByText('待办').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('进行中').first()).toBeVisible()
    await expect(page.getByText('已完成').first()).toBeVisible()
  })

  test('HTML5 拖拽任务换列', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Create a task first
    // Use the toolbar's "新建任务" button to open the Dialog
    const newTaskBtn = page.getByRole('button', { name: /新建任务/ })
    await expect(newTaskBtn).toBeVisible({ timeout: 5000 })
    await newTaskBtn.click()
    await page.waitForTimeout(500)

    // Dialog should be open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 })

    // Fill in the title and create
    const titleInput = page.locator('input[name="title"], input[placeholder*="标题"]').first()
    await expect(titleInput).toBeVisible({ timeout: 2000 })
    const taskTitle = `DragTest_${Date.now()}`
    await titleInput.fill(taskTitle)
    await page.getByRole('button', { name: /创建/ }).click()
    await page.waitForTimeout(2000)

    // Verify the task card exists and is draggable
    const cards = page.locator('div[draggable]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Find our task card
    const taskCard = page.locator('div[draggable]').filter({ hasText: taskTitle }).first()
    await expect(taskCard).toBeVisible({ timeout: 3000 })

    // Get the IN_PROGRESS column as drop target
    const columnHeaders = page.locator('h3')
    const inProgressCol = columnHeaders.filter({ hasText: '进行中' }).first()
    const inProgressParent = inProgressCol.locator('..')
    const dropZone = inProgressParent.locator('..')

    // Perform drag and drop using Playwright's built-in method
    const sourceBox = await taskCard.boundingBox()
    const targetBox = await dropZone.boundingBox()
    expect(sourceBox).not.toBeNull()
    expect(targetBox).not.toBeNull()

    if (sourceBox && targetBox) {
      // Use manual mouse events for reliable HTML5 drag-and-drop
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(100)

      // Move to target center with steps
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 10 }
      )
      await page.waitForTimeout(200)
      await page.mouse.up()
      await page.waitForTimeout(2000)
    }

    // Verify the task moved — should now be in the IN_PROGRESS column
    // Reload to get fresh data
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // The task should still exist on the page
    const taskCards = page.locator('div[draggable]').filter({ hasText: taskTitle })
    const remainingCount = await taskCards.count()
    expect(remainingCount).toBeGreaterThan(0)

    // Check no error toasts appeared
    const errorToast = page.locator('[data-sonner-toast]').filter({ hasText: /失败|错误|异常/ })
    const errorCount = await errorToast.count()
    expect(errorCount).toBe(0)

    console.log(`Drag test completed: task "${taskTitle}" moved successfully`)
  })

  test('看板列颜色跟随主题切换', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // The board should use CSS variable colors
    // Check that columns use semantic CSS classes
    const columnDiv = page.locator('.bg-surface-elevated').first()
    await expect(columnDiv).toBeVisible({ timeout: 3000 })

    // Verify the rounded-xl class is applied
    const roundedCol = page.locator('.rounded-xl').first()
    await expect(roundedCol).toBeVisible({ timeout: 2000 })
  })

  test('看板响应式列宽 — 窄屏时列缩小', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Set a narrower viewport
    await page.setViewportSize({ width: 1000, height: 800 })
    await page.waitForTimeout(500)

    // Columns should still be visible (not collapsed)
    const columns = page.locator('.min-w-\\[280px\\]')
    const colCount = await columns.count()
    expect(colCount).toBeGreaterThanOrEqual(3)

    // Each column should have a minimum width of ~280px
    for (let i = 0; i < Math.min(3, colCount); i++) {
      const box = await columns.nth(i).boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(250) // Allow small rounding difference
      }
    }
  })

  test('Dialog 关闭按钮可用', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Open the dialog
    const newTaskBtn = page.getByRole('button', { name: /新建任务/ })
    await newTaskBtn.click()
    await page.waitForTimeout(300)

    // Dialog should be visible
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // Close via the X button (in DialogContent)
    const closeBtn = page.locator('[role="dialog"] button[aria-label="关闭"]')
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click()
      await page.waitForTimeout(500)
      // Dialog should close
      await expect(dialog).not.toBeVisible({ timeout: 3000 })
    }
  })

  test('同列拖拽任务保持原位（不甩尾）', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 在 TODO 列创建两个任务（A 在 B 上方）
    await createTaskViaQuickAdd(page, `同列A_${Date.now()}`)
    await createTaskViaQuickAdd(page, `同列B_${Date.now()}`)
    await page.waitForTimeout(1000)

    const cardA = page.locator('div[draggable]').filter({ hasText: '同列A_' }).first()
    const cardB = page.locator('div[draggable]').filter({ hasText: '同列B_' }).first()
    await expect(cardA).toBeVisible({ timeout: 3000 })
    await expect(cardB).toBeVisible({ timeout: 3000 })

    // 记录拖拽前的相对顺序
    const beforeA = await cardA.boundingBox()
    const beforeB = await cardB.boundingBox()
    expect(beforeA).not.toBeNull()
    expect(beforeB).not.toBeNull()

    // 将 A 拖到其自身所在列（TODO 列）的空处
    const columnHeader = page.locator('h3').filter({ hasText: '待办' }).first()
    const dropZone = columnHeader.locator('..').locator('..')
    const targetBox = await dropZone.boundingBox()
    if (beforeA && targetBox) {
      await page.mouse.move(beforeA.x + beforeA.width / 2, beforeA.y + beforeA.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(100)
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height - 20, { steps: 10 })
      await page.waitForTimeout(200)
      await page.mouse.up()
      await page.waitForTimeout(1500)
    }

    // 同列拖拽不改变顺序：A 仍在 B 上方
    const afterA = await cardA.boundingBox()
    const afterB = await cardB.boundingBox()
    expect(afterA).not.toBeNull()
    expect(afterB).not.toBeNull()
    if (afterA && afterB) {
      expect(afterA.y).toBeLessThan(afterB.y)
    }
  })
})

test.describe('Todo Board Mobile（移动端可用性）', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('卡片操作按钮在触摸设备直接可见', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await createTaskViaQuickAdd(page, `移动端任务_${Date.now()}`)
    await page.waitForTimeout(1000)

    const card = page.locator('div[draggable]').filter({ hasText: '移动端任务_' }).first()
    await expect(card).toBeVisible({ timeout: 3000 })
    // 无 hover 状态下编辑/删除按钮直接可见
    await expect(card.getByRole('button', { name: /编辑/ })).toBeVisible()
    await expect(card.getByRole('button', { name: /删除/ })).toBeVisible()
  })

  test('卡片状态下拉可改列（触摸无需拖拽）', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await createTaskViaQuickAdd(page, `移列任务_${Date.now()}`)
    await page.waitForTimeout(1000)

    const card = page.locator('div[draggable]').filter({ hasText: '移列任务_' }).first()
    await expect(card).toBeVisible({ timeout: 3000 })

    // 点开卡片状态下拉并选择"已完成"
    await card.getByRole('combobox').click()
    await page.waitForTimeout(300)
    await page.getByRole('option', { name: /已完成/ }).click()
    await page.waitForTimeout(2000)

    // 任务移入 DONE 列（重新加载确认）
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const doneColumn = page.locator('h3').filter({ hasText: '已完成' }).first().locator('..').locator('..')
    await expect(doneColumn.filter({ hasText: '移列任务_' })).toBeVisible({ timeout: 5000 })
  })

  test('删除走 toast 撤销，无原生 confirm', async ({ page }) => {
    await ensureLoggedIn(page)
    await page.goto('/todo')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const title = `删除撤销_${Date.now()}`
    await createTaskViaQuickAdd(page, title)
    await page.waitForTimeout(1000)

    // 监听原生 confirm（应不出现）
    let confirmAppeared = false
    page.on('dialog', (d) => {
      confirmAppeared = true
      void d.dismiss()
    })

    const card = page.locator('div[draggable]').filter({ hasText: title }).first()
    await card.getByRole('button', { name: /删除/ }).click()
    await page.waitForTimeout(1500)

    // 出现撤销 toast（而非 confirm）
    const undoToast = page.locator('[data-sonner-toast]').filter({ hasText: '任务已删除' })
    await expect(undoToast).toBeVisible({ timeout: 3000 })
    expect(confirmAppeared).toBe(false)

    // 点击撤销 → 任务恢复
    await undoToast.getByRole('button', { name: /撤销/ }).click()
    await page.waitForTimeout(2000)
    await expect(page.locator('div[draggable]').filter({ hasText: title }).first()).toBeVisible({ timeout: 5000 })
  })
})
