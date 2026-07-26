# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> 注册新用户并登录
- Location: e2e\auth.spec.ts:8:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="your@email.com"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "日程管理" [level=1] [ref=e9]
      - paragraph [ref=e10]: 创建新账号开始使用
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: 用户名
        - textbox "3-50 位字母/数字/下划线" [active] [ref=e14]: e2e_1785067509644
      - generic [ref=e15]:
        - generic [ref=e16]: 邮箱
        - textbox "you@example.com" [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]: 密码
        - generic [ref=e20]:
          - textbox "至少 8 位" [ref=e21]
          - button [ref=e22]
      - button "创建账号" [ref=e26]
      - paragraph [ref=e27]:
        - text: 已有账号？
        - button "去登录" [ref=e28]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   const uniqueUser = `e2e_${Date.now()}`
  5  |   const email = `${uniqueUser}@test.com`
  6  |   const password = 'test123456'
  7  | 
  8  |   test('注册新用户并登录', async ({ page }) => {
  9  |     await page.goto('/')
  10 | 
  11 |     // 切换到注册模式
  12 |     await page.click('text=去注册')
  13 | 
  14 |     // 填写注册表单
  15 |     await page.fill('input[placeholder="3-50 位字母/数字/下划线"]', uniqueUser)
> 16 |     await page.fill('input[placeholder="your@email.com"]', email)
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  17 |     // 密码输入框
  18 |     const passwordInputs = page.locator('input[placeholder="至少 8 位"]')
  19 |     await passwordInputs.fill(password)
  20 | 
  21 |     // 点击注册
  22 |     await page.click('text=创建账号')
  23 | 
  24 |     // 等待跳转到日历首页
  25 |     await expect(page.locator('text=欢迎回来')).not.toBeVisible({ timeout: 15_000 })
  26 |   })
  27 | 
  28 |   test('已注册用户登录', async ({ page }) => {
  29 |     await page.goto('/')
  30 | 
  31 |     // 填写登录表单
  32 |     await page.fill('input[placeholder="输入用户名或邮箱"]', uniqueUser)
  33 |     await page.fill('input[placeholder="输入密码"]', password)
  34 | 
  35 |     // 点击登录
  36 |     await page.click('text=登录')
  37 | 
  38 |     // 等待跳转
  39 |     await expect(page.locator('text=欢迎回来')).not.toBeVisible({ timeout: 15_000 })
  40 |   })
  41 | })
  42 | 
```