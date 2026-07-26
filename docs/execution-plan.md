# 宏观执行计划

> **版本**: v1.0 | **日期**: 2026-07-20
> **关联文档**: `docs/vision-roadmap-draft.md`
> **状态**: ✅ Phase 1 完成 — v4.5 就绪（M1.6 Go/No-Go: GO）

---

## 总览

将日程管理系统从单一日历工具（v3.1）转型为以**宠物养成为核心差异化**、**插件式模块架构为技术基础**的个人管理中心，覆盖 Web + 微信小程序。

| Phase | 主题 | 时长 | 人周 | 目标版本 |
|-------|------|------|------|---------|
| Phase 0 | 架构重构 | 8 周 | 16 | v4.0 |
| Phase 1 | 情感核心 | 10 周 | 20-30 | v4.5 |
| Phase 2 | 多端 + 深度 | 16 周 | 32-48 | v5.0 |
| Phase 3+ | 生态扩展 | 16-24 周 | 32-72 | v5.x+ |

---

## 启动前技术决策（Phase 0 之前锁定）

| # | 决策 | 推荐方案 | 理由 |
|---|------|---------|------|
| D1 | Monorepo | **Turborepo** | 构建缓存 + 任务编排，比 Nx 简单 |
| D2 | 宠物动画 | **Rive**（需原型验证） | 状态机原生支持情绪切换 |
| D3 | 事件总线 | **同步派发 + 联合类型** | 状态一致性 |
| D4 | 后端模块化 | **模块化单体** | 单团队，包级别 BC 已存在 |
| D5 | 节日库 | **lunar-typescript + 自建数据** | 轻量可维护 |
| D6 | PWA | **vite-plugin-pwa** | Vite 标准方案 |

---

## 关键约束（不可违反）

1. 所有变更走 **OpenSpec 流程**（proposal → design → spec → tasks → apply → verify → archive）
2. `specs/openapi.yaml` 是 API 唯一真相源
3. Controller **必须实现**生成的接口（编译期强约束）
4. DDD 四层依赖方向: **API → 应用 → 领域 ← 基础设施**
5. 所有业务查询强制 `user_id` 过滤
6. CI 四道门禁: 后端 test + 前端 lint/test/build + SDK freshness
7. 每次变更后同步更新文档
8. 版本号同步: `openapi.yaml` ↔ `pom.xml` ↔ `package.json`

---

## Phase 0: 架构重构 (v4.0) — 8 周

**主题**: "基础不牢，地动山摇"

### M0.1: Monorepo 基础 (Week 1-2)

- 根目录新增 `package.json` (Turborepo) + `turbo.json`
- 新增 `packages/shared/` (TypeScript 库)
- 从 `frontend/src/` 提取类型、工具函数到 shared 包
- `frontend/` 通过 workspace 引用 `@daily-schedule/shared`
- Turborepo pipeline: `shared#build` → `frontend#build`

**产出**: `turbo run build` 通过，CI 全绿

### M0.2: 模块注册中心 + 事件总线 (Week 3-4)

**新增**:
- `packages/shared/src/eventBus.ts` — EventBus + SystemEvent 联合类型
- `frontend/src/core/lib/moduleRegistry.ts` — ModuleDefinition + 注册 API

**迁移到 `core/`**:
`store/authStore.ts`, `store/settingsStore.ts` → `core/store/`
`lib/*.ts` → `core/lib/`
`components/ui/*` → `core/components/ui/`
`hooks/useTheme.ts`, `hooks/useNotification.ts`, `hooks/useSseNotifications.ts` → `core/hooks/`
`styles/themes.css` → `core/styles/`

**不动**: `src/api/`（自动生成，不清空不移动）

**产出**: 事件总线 + 模块注册单测通过，所有 import 正确

### M0.3: 日历模块提取 (Week 4-6)

**迁移到 `modules/calendar/`**:
`pages/HomePage.tsx`, `components/calendar/`, `components/event/` → `modules/calendar/components/`
`hooks/useEvents.ts`, `useCategories.ts`, `useTags.ts`, `useKeyboardShortcuts.ts` → `modules/calendar/hooks/`
`store/calendarStore.ts` → `modules/calendar/store/`
`lib/ics.ts`, `styles/calendar.css` → `modules/calendar/`
新增: `modules/calendar/index.ts`, `modules/calendar/routes.tsx`

**重构**: `App.tsx`（动态路由）、`Sidebar.tsx`（模块驱动导航）、`ManageDialog.tsx`（TabbedDialog 容器）

**产出**: 日历所有功能零退化，模块注册中心正确加载日历

### M0.4: PWA + 版本同步 (Week 6-7)

- `vite-plugin-pwa` + manifest.json + Service Worker
- 版本同步脚本

### M0.5: 稳定性 (Week 7-8)

全量回归 → 文档更新 → OpenSpec 归档

**Go/No-Go**: `mvn test` + `npm run verify` 全部通过，日历零退化，shared 包独立构建通过

---

## Phase 1: 情感核心 (v4.5) — 10 周

**主题**: "赋予产品人格"

### M1.1: 宠物后端 (Week 1-2) ✅

- OpenAPI 新增 pets/pet_accessories/pet_interactions 路径
- Flyway V5: `pets` + `pet_accessories` + `pet_interactions` 表
- DDD 完整实现: 15 个新文件 (domain/application/api/infrastructure)
- API: `GET/POST /pets/me`, `POST /feed`, `POST /play`, `GET/POST /shop`

### M1.2: 宠物前端 v1 (Week 2-4) ✅

- **Week 2**: Rive + React 19 + Vite 兼容性验证
- 新建 `modules/pet/`: PetAvatar (Rive Canvas)、PetBubble、PetMenu、PetSelection、PetStatus、petStore、usePet
- 事件总线: 宠物监听 `event:completed`/`event:cancelled`，日历模块 emit 事件

### M1.3: 国际节日引擎 (Week 4-5) ✅

- `packages/shared/src/holiday/`: 四层节日数据（固定公历/浮动公历/农历/地区性）
- 依赖 `lunar-typescript` 处理农历

### M1.4: 节日主题 + 特效 (Week 5-7) ✅

- `core/styles/holiday-themes.css`: 12+ 节日 CSS 变量
- `core/components/effects/`: 特效组件（雪花 CSS / 烟花 tsParticles / 花瓣…）
- Settings 扩展: `auto` 主题、`effectIntensity`、`autoDarkMode`

### M1.5: 任务看板模块 (Week 7-9) ✅

- OpenAPI + Flyway V6: `task` + `task_tag` 表
- 后端 `com.dailyschedule.todo.*` (~12 文件) + 前端 `modules/todo/`
- Kanban CRUD + 拖拽 + 宠物联动

### M1.6: 稳定性 (Week 9-10) ✅

**Go/No-Go**: 宠物可见 + 响应日程 + 节日主题自切 + 看板全功能 + Phase 0 零回归 → **GO** ✅

详见 `docs/phase1-verification-report.md`

---

## Phase 2: 多端 + 深度 (v5.0) — 16 周

**主题**: "无处不在，深度更强"

### M2.1-2.2: 微信小程序 (Week 1-8)

- `packages/miniprogram/` — Taro 4.x + NutUI
- 微信登录（wx.login → 后端换取 JWT）+ Flyway V7: user.openid
- 核心场景: 日历月视图（只读）、任务列表、宠物互动、习惯打卡
- 订阅消息替代 SSE

### M2.3: 习惯 + 专注 (Week 5-10，与 M2.2 并行)

- **习惯**: 每日打卡 + 热力图 + 连续记录 + 统计分析
- **专注**: 番茄钟 + 白噪音 + 关联日程 + 统计

### M2.4: 宠物 v2 (Week 8-12)

- 进化: 蛋 → 幼崽 → 成年 → 传说
- 装扮商店 + 节日限定服装
- 宠物详细页面

### M2.5: 稳定性 (Week 12-16)

**Go/No-Go**: 小程序可用 + 习惯专注全功能 + 宠物进化可行 + Phase 0/1 零回归

---

## Phase 3+: 生态扩展 (v5.x+)

笔记 → 目标管理 → 财务 → 数据看板 → 宠物社区 → 第三方模块 API → i18n
每模块 4-8 周，遵循相同 DDD + 模块注册模式

---

## 关键路径（零 slack）

```
Phase 0 Module Registry → M1.1 Pet Backend → M1.2 Pet Frontend → Phase 2 Mini-Program
```

以上任一节点延迟，后续全线延迟。

---

## 并行化机会

- Phase 0: M0.1 (shared) ∥ M0.4 (PWA)
- Phase 1: M1.1+M1.2 (宠物) ∥ M1.3+M1.4 (节日) ∥ M1.5 (看板)
- Phase 2: M2.1+M2.2 (小程序) ∥ M2.3 (习惯+专注)

---

## 测试策略

### Phase 0 回归防护（四层）

1. **现有测试**: 185 后端 + 15 前端，每次改动必跑
2. **模块边界测试**: 新增 10+ 前端测试（事件总线、模块注册）
3. **手动冒烟**: 创建/编辑/删除/拖拽/状态/筛选/搜索/SSE/ICS/主题/登录
4. **Feature Flag**: `USE_MODULE_CALENDAR` 开关，出问题立即回退

### 测试扩展

| Phase | 后端新增 | 前端新增 |
|-------|---------|---------|
| Phase 0 | 0 | 10+ |
| Phase 1 | 30+ | 20+ |
| Phase 2 | 40+ | 30+ |

---

## 风险评估

| Phase | 主要风险 | 缓解措施 |
|-------|---------|---------|
| 0 | 日历功能退化 | 全量测试 + Feature Flag 回退 |
| 0 | Monorepo 构建异常 | 分支验证再合入 |
| 1 | Rive 与 Vite 不兼容 | 原型验证 + 备选 Lottie |
| 1 | 特效拖垮移动端 | 强度分级 + 默认 low + GPU 检测 |
| 2 | Taro + shared 不兼容 | M2.1 启动时 spike + 适配层 |
| 2 | 微信审核被拒 | 避免任何虚拟支付/博彩元素 |

---

## OpenSpec Changes 参考（Phase 0）

1. `monorepo-foundation` — Turborepo + shared package
2. `event-bus-module-registry` — 核心基础设施
3. `core-directory-restructure` — 核心文件迁移到 core/
4. `calendar-module-extraction` — 日历模块化
5. `app-tsx-refactor` — 动态模块路由加载
6. `sidebar-refactor` — 模块驱动导航
7. `managedialog-refactor` — TabbedDialog 容器化
8. `pwa-support` — manifest + service worker
9. `version-sync-automation` — 版本对齐脚本

**Phase 1 实际归档变更（超出原计划）**:
- `fix-module-routing-and-ui` — 修复路由和侧边栏问题
- `pet-v2-roaming-animation` — 宠物 v2 游走动画（自由漫游 + SVG 插画 + 粒子爆发）

---

## 验证命令

```bash
cd backend && mvn test                  # 后端全量
cd frontend && npm run verify           # lint + tsc + build + test
turbo run build                         # Monorepo 全量
```
