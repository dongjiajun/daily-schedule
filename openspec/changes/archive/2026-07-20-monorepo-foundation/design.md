# Design: Monorepo Foundation

## Context

当前项目结构为单体仓库：`backend/`（Maven）+ `frontend/`（Vite + React），无共享代码层。所有 TypeScript 类型、工具函数、常量散落在 `frontend/src/` 中，与 UI 代码耦合。

路线图已明确 Phase 0 第一步为 Monorepo 化，后续需要 `packages/shared/` 支撑 Web + 微信小程序双端代码复用。`packages/shared/` 也是下一变更 `event-bus-module-registry` 的落地点（事件类型定义必须在 shared 中）。

**关键约束**：
- `frontend/src/api/` 由 `npm run generate:api` 自动生成，不可手动编辑
- 后端 `backend/` 本次完全不涉及
- 所有现有业务功能零退化
- CI 四道门禁（后端 test + 前端 lint/test/build）必须保持通过

## Goals / Non-Goals

**Goals:**
- 建立 pnpm workspace + Turborepo 的 Monorepo 基础结构
- 创建 `packages/shared/` TypeScript 库，提取纯逻辑代码（类型、常量、工具函数）
- `frontend/` 通过 workspace 协议引用 `@daily-schedule/shared`
- Turborepo pipeline 确保构建顺序正确：`shared#build` → `frontend#build`
- 现有测试、lint、构建全部通过

**Non-Goals:**
- 不提取 React 组件、hooks、Zustand stores 到 shared（这些是 UI 层专属）
- 不移动 `src/api/` 自动生成的代码
- 不修改后端
- 不引入新业务功能
- 不处理微信小程序（那是 Phase 2 的事）
- 不在本变更中配置 OpenAPI 生成器输出到 shared（那是后续优化）

## Decisions

### Decision 1: 包管理器 — pnpm

- **选择**: pnpm workspaces
- **理由**: 
  - 严格的依赖解析（无幽灵依赖），避免跨包意外访问
  - workspace 协议（`workspace:*`）天然支持本地包引用
  - 磁盘效率高（全局 store + 硬链接）
  - Turborepo 官方首推
- **备选方案**:
  - npm workspaces：幽灵依赖问题，安装慢
  - yarn workspaces：与 pnpm 功能接近但生态迁移趋势偏向 pnpm

### Decision 2: 任务编排 — Turborepo

- **选择**: Turborepo (`turbo.json`)
- **理由**:
  - 构建缓存（`shared` 未变则跳过 `frontend` 构建）
  - 任务依赖声明式配置（`dependsOn`）
  - 比 Nx 简单，无插件体系负担
  - 执行计划已明确推荐（决策 D1）
- **备选方案**:
  - Nx：功能更全但复杂度高，适合大型 Monorepo（50+ 包），当前 2-3 包不需要
  - Lerna：已被 Turborepo/Nx 取代，社区停滞

### Decision 3: shared 包构建方式 — tsc

- **选择**: `tsc` 编译（`tsc -p tsconfig.json`），输出到 `dist/`
- **理由**:
  - shared 包只有纯 TypeScript（类型 + 工具函数），无 JSX/React/CSS
  - tsc 生成 `.js` + `.d.ts` + sourcemap，满足下游消费需求
  - 无需 bundler（Vite/Rollup）的额外复杂度
- **备选方案**:
  - Vite library mode：可输出 ESM + CJS 双格式，但对于纯逻辑库过重
  - tsup：基于 esbuild，快但类型生成需额外 tsc 步骤

### Decision 4: shared 包内容边界

- **选择**: 严格限定为"纯逻辑"——类型定义、业务常量、纯函数工具
- **理由**:
  - 后续微信小程序用 Taro，共享代码不能依赖 React/DOM API
  - 保持 shared 包零依赖（或仅 `dayjs` 等跨平台库），最大化复用
  - 明确的边界防止 shared 包膨胀
- **提取清单**:
  | 来源 | 内容 | 目标路径 |
  |------|------|---------|
  | `lib/colors.ts` | `PRESET_COLORS` 常量 | `packages/shared/src/constants/colors.ts` |
  | `api/types.gen.ts` | `EventStatus` 类型（手动复制） | `packages/shared/src/types/event.ts` |
  | 新建 | API 端点路径常量 | `packages/shared/src/constants/api.ts` |
  | 新建 | 业务规则常量（状态枚举、优先级等） | `packages/shared/src/constants/index.ts` |
- **不提取**:
  | 来源 | 原因 |
  |------|------|
  | `api/types.gen.ts`（全部） | 自动生成，后续可配生成器输出到 shared |
  | `lib/utils.ts` (`cn`) | 依赖 `clsx` + `tailwind-merge`，纯 UI 工具 |
  | `lib/unwrap.ts` | 依赖 `ApiResponse`（生成的类型），且紧耦合 hey-api |
  | `lib/ics.ts` | 使用 `document` / `Blob` / `URL`（浏览器 API） |
  | `lib/authInterceptor.ts` | 使用 `useAuthStore`（Zustand）和浏览器 fetch |

### Decision 5: 类型处理策略

- **选择**: shared 包手动定义核心业务类型（与 `types.gen.ts` 有重叠），不修改自动生成流程
- **理由**:
  - `types.gen.ts` 由 `@hey-api/openapi-ts` 生成，每次 `generate:api` 都会覆盖
  - 不能直接移动它，也不能让生成器输出到 shared（那是后续优化）
  - Phase 0 的目标是建立结构，不是消灭所有重复
  - 后续可在 `openapi-ts.config.ts` 中配置输出路径到 shared
- **权衡**: 短期内 shared 和 `types.gen.ts` 存在类型重复。接受此 tradeoff，在后续变更中解决。

### Decision 6: frontend 引用 shared 的方式

- **选择**: workspace 协议 + TypeScript project references
- **理由**:
  - `package.json`: `"@daily-schedule/shared": "workspace:*"` — pnpm 自动链接
  - `tsconfig.json`: 添加 `"references": [{ "path": "../packages/shared" }]` — tsc 感知依赖
  - Vite 无需额外配置（默认解析 workspace 包）
- **备选方案**:
  - 仅 workspace 协议不配 project references：tsc 不会自动构建 shared，需手动跑 `turbo`

## DDD Layer Design

不涉及。本次变更仅动前端项目结构和构建系统。

## API Design

不涉及。`specs/openapi.yaml` 不变，无新增/修改端点。

## Database Design

不涉及。无表结构变更，无 Flyway 迁移。

## Frontend Structure Design

### 目标目录结构

```
daily-schedule/
├── package.json              # 根 workspace 定义 (private, workspaces: ["packages/*", "frontend"])
├── pnpm-workspace.yaml       # workspace 包声明
├── turbo.json                # Turborepo pipeline
├── pnpm-lock.yaml            # 锁文件（由 pnpm 生成）
├── .npmrc                    # pnpm 配置
├── backend/                  # 不变
├── frontend/                 # 现有前端（import 路径更新）
├── packages/
│   └── shared/
│       ├── package.json      # @daily-schedule/shared
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts      # barrel export
│           ├── types/
│           │   ├── index.ts
│           │   └── event.ts  # EventStatus, 核心实体类型
│           └── constants/
│               ├── index.ts
│               ├── colors.ts # PRESET_COLORS
│               └── api.ts    # API 端点路径常量
├── docs/
└── specs/
```

### 关键文件设计

**根 `package.json`**:
```json
{
  "private": true,
  "name": "daily-schedule",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "verify": "turbo run verify"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - "frontend"
  - "packages/*"
```

**`turbo.json`**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "packages/shared/dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {},
    "verify": {
      "dependsOn": ["lint", "build", "test"]
    }
  }
}
```

**`packages/shared/package.json`**:
```json
{
  "name": "@daily-schedule/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "~6.0.2"
  }
}
```

### import 迁移策略

**原则**: 只迁移"安全"的 import ——纯类型和纯常量。不动 UI 相关 import。

**迁移前 → 迁移后**:
```typescript
// 迁移前
import { PRESET_COLORS } from '@/lib/colors'
import type { EventStatus } from '@/api/types.gen'

// 迁移后
import { PRESET_COLORS } from '@daily-schedule/shared'
import type { EventStatus } from '@daily-schedule/shared'
```

**受影响的文件（预估 10-15 个）**:
- `components/event/EventForm.tsx` — PRESET_COLORS, EventStatus
- `components/event/EventModal.tsx` — PRESET_COLORS, EventStatus
- `components/calendar/CalendarView.tsx` — EventStatus
- `components/layout/ManageDialog.tsx` — PRESET_COLORS
- `hooks/useEvents.ts` — EventStatus
- `store/calendarStore.ts` — EventStatus
- `lib/colors.ts` — 改为 re-export from shared

### 原文件处理

对于被提取到 shared 的源文件，采用 **re-export 兼容层**模式，而非删除：

```typescript
// frontend/src/lib/colors.ts (改后)
export { PRESET_COLORS } from '@daily-schedule/shared'
```

这样做的好处：
1. 现有 `@/lib/colors` import 不会立即全部报错，可渐进迁移
2. 如果后续决定不迁移某个 import，已有代码不受影响
3. 最终可清理 re-export 文件

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| shared 与 `types.gen.ts` 类型重复 | 明确标注 shared 中的类型为手动维护；后续变更配置 OpenAPI 生成器输出到 shared |
| pnpm 安装失败（Node 版本/网络） | CI 中锁定 pnpm 版本；本地用 `corepack` 管理 |
| Turborepo 缓存导致 CI 误判 | `turbo.json` 中明确 `outputs`；CI 中必要时 `turbo run build --force` |
| import 路径迁移导致运行时错误 | 渐进迁移 + re-export 兼容层；`npm run verify` 全量验证 |
| `package.json` 移动导致 Docker 构建失败 | Phase 0 不动 Docker；后续 Phase 处理 |

## Migration Plan

### 部署步骤

1. **创建 Monorepo 基础文件**（无破坏性）
   - 新建根 `package.json`、`pnpm-workspace.yaml`、`turbo.json`、`.npmrc`
   - `pnpm install` 验证 workspace 解析正确
   
2. **创建 shared 包**（独立，不影响 frontend）
   - 新建 `packages/shared/` 完整结构
   - `cd packages/shared && pnpm build` 验证独立构建
   
3. **frontend 接入 shared**（关键步骤）
   - `frontend/package.json` 添加 `@daily-schedule/shared: workspace:*`
   - `frontend/tsconfig.app.json` 添加 project reference
   - `pnpm install` 验证链接正确

4. **迁移 import 路径**（渐进，逐文件）
   - 修改 shared 源文件为 re-export 兼容层
   - 逐个修改消费方 import 为 `@daily-schedule/shared`
   - 每改一批就跑 `npm run verify`

5. **验证 + 文档**
   - `turbo run build` 全量构建
   - `turbo run verify` 全量验证
   - 更新 `docs/architecture.md`、`CLAUDE.md`

### 回滚策略

- 在任何步骤出错时：
  1. `git checkout -- .` 恢复所有文件
  2. 删除新增的根文件 + `packages/` 目录
  3. `cd frontend && npm install` 恢复原状
- 零数据库变更，无持久化副作用

### 回滚触发条件

- `turbo run build` 失败
- `npm run verify`（frontend）失败
- 任何日历功能手动冒烟失败

## Open Questions

1. **Docker 构建适配**：当前 `docker-compose.yml` 在根目录，Monorepo 后 `frontend/` 的 `node_modules` 提升到根目录，Dockerfile 是否需要调整？→ 不在本变更范围，后续 Phase 处理
2. **CI 中的 pnpm 安装**：`.github/workflows/` 是否需要切换到 pnpm？→ 需要适配，属于本变更范围
3. **`package.json` 版本号**：shared 包的初始版本号？→ `0.0.1`，与 Monorepo 根一致
