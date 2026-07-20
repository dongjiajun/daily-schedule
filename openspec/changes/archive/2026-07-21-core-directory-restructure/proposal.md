# Proposal: Core Directory Restructure

## Why

路线图要求插件式架构：`core/`（稳定基础设施）与 `modules/`（可插拔功能）分离。`event-bus-module-registry` 已在 `core/lib/` 中创建了 eventBus 和 moduleRegistry，但现有代码（stores、lib、ui components、hooks、styles）仍散落在 `src/` 顶层，需要迁移到 `core/` 下，建立清晰的架构边界。

## What Changes

- `store/authStore.ts` → `core/store/authStore.ts`
- `store/settingsStore.ts` → `core/store/settingsStore.ts`
- `lib/utils.ts` (`cn`) → `core/lib/utils.ts`
- `lib/unwrap.ts` → `core/lib/unwrap.ts`
- `lib/ics.ts` → `core/lib/ics.ts`
- `lib/authInterceptor.ts` → `core/lib/authInterceptor.ts`
- `lib/colors.ts` → 保留在原位（已是 re-export 兼容层，向后兼容）
- `lib/__tests__/` → `core/lib/__tests__/`
- `components/ui/*` (button/dialog/input/label/popover/select/switch/tabs/textarea) → `core/components/ui/`
- `hooks/useTheme.ts` → `core/hooks/useTheme.ts`
- `hooks/useNotification.ts` → `core/hooks/useNotification.ts`
- `hooks/useSseNotifications.ts` → `core/hooks/useSseNotifications.ts`
- `styles/themes.css` → `core/styles/themes.css`
- 所有受影响文件的 import 路径更新（`@/store/` → `@/core/store/` 等）

## Capabilities

### New Capabilities

- `core-directory`: 核心目录结构 — `core/store/`、`core/lib/`、`core/components/ui/`、`core/hooks/`、`core/styles/`

### Modified Capabilities

无（纯文件搬迁，不修改业务逻辑）

## API Contract Impact

无。

## DDD Layer Impact

无。

## Database Impact

无。

## Impact

### 移动的文件（~25 个）

| 来源 | 目标 | 文件数 |
|------|------|--------|
| `store/` | `core/store/` | 2 (+ 1 test) |
| `lib/` | `core/lib/` | 4 (+ 2 tests) |
| `components/ui/` | `core/components/ui/` | 9 |
| `hooks/` | `core/hooks/` | 3 |
| `styles/` | `core/styles/` | 1 |

### Import 路径变更

所有引用上述文件的 import 需更新路径前缀：`@/store/` → `@/core/store/`，`@/lib/` → `@/core/lib/`，`@/components/ui/` → `@/core/components/ui/`，`@/hooks/` → `@/core/hooks/`。
