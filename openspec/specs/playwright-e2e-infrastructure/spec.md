# Playwright E2E Infrastructure

引入 Playwright 端到端测试框架，编写关键路径 E2E 用例，集成到 CI。

## Purpose

Playwright E2E 基础设施 — 引入端到端测试框架，编写关键路径 E2E 用例并集成到 CI。

## Requirements

### Requirement: Playwright 框架安装与配置
系统 SHALL 引入 `@playwright/test` 依赖并配置 `playwright.config.ts`。

#### Scenario: 依赖安装成功
- **WHEN** 执行 `pnpm add -D @playwright/test` 和 `pnpm exec playwright install chromium`
- **THEN** `frontend/package.json` devDependencies 包含 `@playwright/test`
- **AND** Playwright Chromium 浏览器下载成功

#### Scenario: playwright.config.ts 配置正确
- **WHEN** 读取 `frontend/playwright.config.ts`
- **THEN** testDir 指向 `./e2e`，webServer 自动启动后端（test profile）和前端（Vite dev），baseURL 为 `http://localhost:5173`

#### Scenario: pnpm test:e2e 脚本可用
- **WHEN** 执行 `pnpm run test:e2e`（前后端已通过 webServer 启动）
- **THEN** Playwright 运行所有 e2e 测试并输出结果

---

### Requirement: 认证 E2E 测试
系统 SHALL 提供注册和登录的端到端测试用例。

#### Scenario: 注册新用户并登录
- **WHEN** 访问首页 → 填写注册表单（用户名/邮箱/密码）→ 点击注册
- **THEN** 自动登录，跳转到日历首页
- **AND** 页面显示日历视图（非登录页）

#### Scenario: 已有用户登录
- **WHEN** 访问首页 → 切换到登录 → 输入凭据 → 点击登录
- **THEN** 跳转到日历首页

---

### Requirement: 日程 E2E 测试
系统 SHALL 提供日程 CRUD 的端到端测试用例。

#### Scenario: 创建日程并在日历中可见
- **WHEN** 登录后 → 点击新建日程 → 填写标题/时间 → 保存
- **THEN** 日历月视图中出现该日程

#### Scenario: 编辑日程
- **WHEN** 登录后 → 点击已有日程 → 修改标题 → 保存
- **THEN** 日历中该日程标题更新

#### Scenario: 完成日程后 UI 变化
- **WHEN** 登录后 → 悬停日程 → 点击完成按钮
- **THEN** 日程显示为完成样式（删除线或灰色）

---

### Requirement: 任务看板 E2E 测试
系统 SHALL 提供任务看板操作的端到端测试用例。

#### Scenario: 创建任务并拖拽
- **WHEN** 导航到 /todo → 创建任务 → 将卡片从 TODO 拖至 IN_PROGRESS
- **THEN** 卡片出现在 IN_PROGRESS 列

#### Scenario: 任务状态持久化
- **WHEN** 将任务拖到 DONE → 刷新页面
- **THEN** 任务仍在 DONE 列

---

### Requirement: CI E2E 集成
系统 SHALL 在 GitHub Actions CI 中运行 E2E 测试。

#### Scenario: CI 中 E2E 步骤通过
- **WHEN** 推送代码触发 CI
- **THEN** CI 中安装 Playwright → 启动前后端 → 运行 E2E → 全部通过
- **AND** E2E 失败时 CI 标记为失败
