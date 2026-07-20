# Design: Core Directory Restructure

## Context

当前 `frontend/src/` 下 stores、lib、ui 组件、hooks、styles 均平铺在顶层，与路线图定义的 `core/`（稳定基础设施）+ `modules/`（可插拔功能）架构不符。`event-bus-module-registry` 已在 `core/lib/` 下建立了 eventBus 和 moduleRegistry，本变更将剩余基础设施代码迁入 `core/`。

**约束**：
- 所有现有功能零退化
- 所有 import 路径必须更新
- `src/api/`（自动生成）不动
- `lib/colors.ts` 保留原位（已是 re-export 兼容层，向后兼容）

## Goals / Non-Goals

**Goals:**
- 迁移 stores 到 `core/store/`
- 迁移 lib 工具到 `core/lib/`
- 迁移 shadcn/ui 组件到 `core/components/ui/`
- 迁移共享 hooks 到 `core/hooks/`
- 迁移主题样式到 `core/styles/`
- 更新所有受影响文件的 import 路径

**Non-Goals:**
- 不修改任何业务逻辑
- 不动 `lib/colors.ts`（re-export 兼容层）
- 不迁移 `hooks/useEvents.ts`、`useCategories.ts`、`useTags.ts`（这些是 calendar 模块专属，留待 `calendar-module-extraction` 迁移）
- 不动后端

## Decisions

### Decision 1: 迁移方式 — 物理移动 + 路径替换

- **选择**: `git mv` 物理移动文件，然后全局替换 import 路径
- **理由**:
  - 保留 git 历史（`git mv` 被 Git 识别为重命名）
  - `@/` 路径别名已配置为 `src/`，新路径 `@/core/` 自然映射到 `src/core/`
  - 不引入 barrel export 兼容层（与 colors.ts 不同，这些文件没有外部消费者需要兼容）
- **备选方案**:
  - 原地保留 + barrel re-export：增加额外文件，后续清理麻烦

### Decision 2: hooks 迁移范围

- **选择**: 仅迁移 `useTheme`、`useNotification`、`useSseNotifications` 三个共享 hook
- **理由**:
  - 这三个 hook 是跨模块基础设施（主题、通知、SSE）
  - `useEvents`、`useCategories`、`useTags` 属于日历业务，应迁入 `modules/calendar/hooks/`
  - `useKeyboardShortcuts` 也属于日历业务

### Decision 3: 不创建兼容层

- **选择**: 直接在原位置删除文件，全部 import 更新为 `@/core/` 路径
- **理由**:
  - 一次性的全局搜索替换即可覆盖所有引用
  - barrel re-export 兼容层会让 `src/lib/` 和 `src/store/` 只剩空壳，不如直接清理
  - `tsc` + `eslint` 能在构建阶段捕获遗漏的 import

## Target Structure

```
frontend/src/
├── core/
│   ├── lib/
│   │   ├── eventBus.ts        (已有)
│   │   ├── moduleRegistry.ts  (已有)
│   │   ├── utils.ts           ← lib/utils.ts
│   │   ├── unwrap.ts          ← lib/unwrap.ts
│   │   ├── ics.ts             ← lib/ics.ts
│   │   ├── authInterceptor.ts ← lib/authInterceptor.ts
│   │   └── __tests__/         ← lib/__tests__/
│   ├── store/
│   │   ├── authStore.ts       ← store/authStore.ts
│   │   ├── settingsStore.ts   ← store/settingsStore.ts
│   │   └── __tests__/         ← store/__tests__/
│   ├── components/ui/         ← components/ui/* (9 files)
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useNotification.ts
│   │   └── useSseNotifications.ts
│   └── styles/
│       └── themes.css
├── lib/
│   └── colors.ts              (保留 — re-export 兼容层)
├── hooks/                     (保留 useEvents/useCategories/useTags/useKeyboardShortcuts — 日历业务)
├── store/
│   └── calendarStore.ts       (保留 — 日历业务)
├── components/
│   ├── calendar/              (保留)
│   ├── event/                 (保留)
│   └── layout/                (保留)
└── api/                       (不变 — 自动生成)
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| import 路径遗漏导致编译失败 | `tsc -b` + `eslint` 全量检查，逐文件确认 |
| `git mv` 后 git blame 断链 | 使用 `git mv` 保留历史；即使断链，Phase 0 是架构重构，可接受 |
| 测试文件的 import 也需要更新 | `vitest` 全量运行确认 |

## Migration Plan

纯机械操作，按顺序执行：
1. 创建目标目录（`core/store/`、`core/hooks/`、`core/styles/`）
2. `git mv` 逐批移动文件
3. 全局搜索替换 import 路径
4. `tsc -b` + `eslint` + `vitest` 验证
5. 清理空目录
