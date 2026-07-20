# Core Directory

核心目录结构，将稳定基础设施代码（stores、lib、ui 组件、hooks、styles）从 `src/` 顶层迁移到 `src/core/` 下，与 `modules/` 形成清晰的架构边界。

## ADDED Requirements

### Requirement: Core Directory Structure

frontend SHALL 建立 `src/core/` 核心目录，包含以下子目录：

- `core/lib/` — 共享工具库（utils、unwrap、ics、authInterceptor、eventBus、moduleRegistry）
- `core/store/` — 跨模块状态（authStore、settingsStore）
- `core/components/ui/` — shadcn/ui 基础组件（button、dialog、input、label、popover、select、switch、tabs、textarea）
- `core/hooks/` — 跨模块 hooks（useTheme、useNotification、useSseNotifications）
- `core/styles/` — 主题样式（themes.css）

#### Scenario: 核心目录布局

- **WHEN** 开发者查看 `frontend/src/core/` 目录
- **THEN** SHALL 看到 lib/、store/、components/ui/、hooks/、styles/ 五个子目录
- **THEN** 每个子目录 SHALL 包含对应迁移的文件

### Requirement: Import Path Update

所有被迁移文件的 import 引用 SHALL 更新为新路径。

- `@/store/authStore` → `@/core/store/authStore`
- `@/store/settingsStore` → `@/core/store/settingsStore`
- `@/lib/utils` → `@/core/lib/utils`
- `@/lib/unwrap` → `@/core/lib/unwrap`
- `@/lib/ics` → `@/core/lib/ics`
- `@/lib/authInterceptor` → `@/core/lib/authInterceptor`
- `@/components/ui/*` → `@/core/components/ui/*`
- `@/hooks/useTheme` → `@/core/hooks/useTheme`
- `@/hooks/useNotification` → `@/core/hooks/useNotification`
- `@/hooks/useSseNotifications` → `@/core/hooks/useSseNotifications`

#### Scenario: 构建通过

- **WHEN** 所有文件迁移完成且 import 路径更新
- **THEN** `tsc -b` SHALL 编译通过，无 "Cannot find module" 错误
- **THEN** `vite build` SHALL 构建成功

#### Scenario: 测试通过

- **WHEN** 迁移后的测试文件 import 路径已更新
- **THEN** `vitest run` SHALL 全部通过

### Requirement: Shared Hooks Remain in Place

业务专属 hooks（useEvents、useCategories、useTags、useKeyboardShortcuts）SHALL 保留在 `src/hooks/` 中，不迁入 core。

- 日历业务 hooks 留待 `calendar-module-extraction` 变更迁移到 `modules/calendar/hooks/`
- `lib/colors.ts` SHALL 保留原位（re-export 兼容层）

#### Scenario: 业务 hooks 不受影响

- **WHEN** 核心目录迁移完成
- **THEN** `src/hooks/useEvents.ts`、`useCategories.ts`、`useTags.ts`、`useKeyboardShortcuts.ts` SHALL 仍在原路径
- **THEN** 其功能 SHALL 不受影响

## Test Coverage

| Scenario | 测试方式 | 状态 |
|----------|---------|------|
| 核心目录布局 | 目视检查 | ➕ |
| 构建通过 | `turbo run build` | ➕ |
| 测试通过 | `vitest run` | ➕ |
| 业务 hooks 不受影响 | `vitest run` | ➕ |
