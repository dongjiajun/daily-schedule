# Design: 前端测试覆盖补全 + Playwright E2E 引入

## Context

前端测试覆盖率仅 23%（19/83 文件），E2E 为零。Vitest + React Testing Library + jsdom 是现有单元测试基础设施。本次变更不修改业务代码，纯粹补齐测试。

现有测试架构：
```
vitest.config.ts
  ├── environment: 'jsdom'
  ├── setup: @testing-library/jest-dom
  └── globals: true
```

## Goals / Non-Goals

**Goals:**
- P0 关键路径文件 100% 有单元测试（9 个文件）
- P1 重要功能文件尽量补齐（15+ 个文件）
- 引入 Playwright，建立 E2E 测试基础设施
- CI 集成：E2E 步骤在 GitHub Actions 中运行
- 不影响现有功能，不修改业务代码

**Non-Goals:**
- 不追求 100% 整体覆盖率 —— shadcn/ui 组件、SVG 资产、CSS 文件不测
- 不改动后端
- 不引入测试覆盖率门禁（本次先补测试，后续可加）
- 不在此次实现视觉回归/截图对比测试

## Decisions

### Decision 1: 测试框架 —— 维持 Vitest + React Testing Library，不入新框架

- **选择**: 继续使用 vitest + @testing-library/react + jsdom
- **理由**: 现有 19 个测试文件已使用该栈，团队熟悉；vitest 与 Vite 深度集成，零额外配置
- **备选方案**: Jest — 需额外配置，与 Vite 集成不如 vitest 原生

### Decision 2: E2E 框架 —— Playwright

- **选择**: @playwright/test
- **理由**: 微软维护、多浏览器支持、自动等待、UI mode 调试、CI 集成成熟、Vite 兼容好
- **备选方案**: Cypress — 在 Windows 上安装体验差，对 pnpm 支持不如 Playwright；Puppeteer — 缺测试框架功能

### Decision 3: E2E 启动策略 —— Playwright webServer 自动启动前后端

- **选择**: playwright.config.ts 中 `webServer` 配置两个服务：
  - Backend: `mvn spring-boot:run -Dspring-boot.run.profiles=test`（H2，无需 MySQL）
  - Frontend: `pnpm run dev`（Vite dev server）
- **理由**: CI 中无需手动启动服务，一条命令 `pnpm run test:e2e` 跑完
- **备选方案**: 手动启动或在 CI 中用 docker-compose 启动 — 配置复杂

### Decision 4: 测试文件组织 —— 就近放置 `__tests__/` 目录

- **选择**: 遵循现有约定，每个测试文件放在对应源码目录的 `__tests__/` 下
- **理由**: 现有 19 个测试文件全部采用此模式，保持一致

### Decision 5: 优先级分批策略 —— P0 先，P1 后，P2 跳过

- **选择**: 先集中完成 9 个 P0 文件测试，再推进 P1
- **理由**: P0 是关键路径（认证、通信、状态管理），覆盖后能防住最危险的回归

## Test Technical Design

### 单元测试模式参考

**纯逻辑模块**（如 eventBus、utils、store）：
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
// 直接测试函数/类的输入输出，不需要 jsdom
```

**React Hook 测试**（如 useCategories、useTasks）：
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// 需要 wrapper 提供 QueryClient + BrowserRouter
```

**组件测试**（如 LoginPage、EventModal）：
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
// 需要 mock API SDK、Zustand store、React Router
```

### P0 文件测试策略

| 文件 | 测试类型 | 关键点 |
|------|---------|--------|
| `eventBus.ts` | 纯逻辑 | on/emit/off/removeAll/事件类型安全/多个监听器 |
| `authInterceptor.ts` | Mock 层 | Bearer 注入/过期前刷新/401 登出/单飞锁 |
| `calendarStore.ts` | Zustand store | 状态初始化/视图切换/打开关闭弹窗/筛选设置 |
| `useCategories.ts` | Hook | 用 renderHook + wrapper，mock API 返回 |
| `useTags.ts` | Hook | 同上 |
| `EventForm.tsx` | 组件 | 表单字段渲染/校验/默认值/提交回调 |
| `EventModal.tsx` | 组件 | 打开/关闭/提交/删除确认 |
| `LoginPage.tsx` | 组件 | 登录/注册表单切换/提交/错误显示 |
| `App.tsx` | 组件 | AuthGuard 未认证→LoginPage/已认证→AppShell |

### Playwright E2E 设计

**目录结构**:
```
frontend/
├── playwright.config.ts
├── e2e/
│   ├── auth.spec.ts        # 注册 + 登录
│   ├── calendar.spec.ts    # 创建/编辑/删除/拖拽日程
│   ├── task.spec.ts        # 看板 CRUD + 拖拽
│   └── pet.spec.ts         # 宠物互动 + 粒子效果
```

**配置关键点**:
```typescript
// playwright.config.ts
{
  testDir: './e2e',
  webServer: [
    { command: 'cd ../backend && mvn spring-boot:run -Dspring-boot.run.profiles=test', port: 8080 },
    { command: 'pnpm run dev', port: 5173, reuseExistingServer: true }
  ],
  use: { baseURL: 'http://localhost:5173' },
  projects: [{ name: 'chromium' }]  // CI 只跑 Chromium
}
```

**E2E 场景（首批 5 条）**:

| 文件 | 场景 |
|------|------|
| `auth.spec.ts` | 注册新用户 → 登录 → 跳转到日历首页 |
| `calendar.spec.ts` | 登录后创建日程 → 月视图中可见 → 编辑标题 → 拖拽改期 |
| `calendar.spec.ts` | 完成日程 → 确认 UI 变化 |
| `task.spec.ts` | 导航到 /todo → 创建任务 → 拖拽到 DONE |
| `pet.spec.ts` | 完成日程后 → 确认宠物粒子效果触发 |

## CI Integration

在 `.github/workflows/ci.yml` 的 `frontend` job 末尾新增 E2E step：

```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium

- name: E2E tests
  working-directory: frontend
  run: pnpm run test:e2e
```

> **注意**: E2E 依赖后端（test profile H2），需要 Maven 和 Java 21+ 环境。可以将 E2E 放在 backend job 之后执行，或创建一个独立的 e2e job。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| E2E 在 CI 中不稳定（flaky） | 使用 `retries: 2`；Playwright 自动等待；test profile H2 隔离 |
| P0 测试编写时发现业务代码 bug | 记录缺陷，单独修复；本次不修改业务逻辑 |
| Playwright 安装增加 CI 时间 | 缓存 Playwright browsers；CI 中 `cache: playwright` |
| mock 覆盖不全导致假阳性 | 组件测试用 React Testing Library 渲染真实 DOM；关键路径用 E2E 兜底 |
| Windows CI 不支持（GitHub Actions ubuntu runner） | 仅 ubuntu runner 即可；Playwright 跨平台 |

## Open Questions

- E2E 是否在 GitHub Actions 免费额度内？（Playwright 单 Chromium 用例约 10-30s，5 条 < 3min）
- 是否需要 `test:coverage` 脚本（vitest coverage）？（本次可先不加，后续视需要引入）
