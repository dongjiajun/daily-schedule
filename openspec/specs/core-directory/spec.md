# Core Directory

## Purpose

定义 `frontend/src/core/` 核心目录结构——将稳定基础设施代码（stores、lib 工具、shadcn/ui 组件、共享 hooks、主题样式）从 `src/` 顶层收敛到 `core/` 下，与 `modules/` 形成清晰的架构边界。业务专属代码（日历 hooks/store）保留在 `src/` 顶层，留待后续迁移到具体模块目录。

## Requirements

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

所有被迁移文件的 import 引用 SHALL 更新为 `@/core/` 下的新路径：`@/store/*` → `@/core/store/*`、`@/lib/*` → `@/core/lib/*`、`@/components/ui/*` → `@/core/components/ui/*`、`@/hooks/*` → `@/core/hooks/*`。

#### Scenario: import 路径逐项映射

- **WHEN** 迁移后的文件引用被移动的核心基础设施模块
- **THEN** import 路径 SHALL 按以下逐项映射更新：
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

### Requirement: Shell 状态与区域注册表归属 core
前端全局 Shell UI 状态（新手引导、快捷键弹窗、移动端侧栏抽屉）SHALL 收敛到 `core/store/shellStore.ts`；区域注册表 `zoneRegistry` SHALL 位于 `core/lib/zoneRegistry.ts`；`CalendarView` 类型定义 SHALL 位于 `core/store/settingsStore.ts` 供 `core/` 与 `modules/calendar/` 共享。

#### Scenario: shellStore 统一管理全局壳层状态
- **WHEN** Shell 或业务模块切换侧栏抽屉、快捷键弹窗或新手引导状态
- **THEN** 状态由 `useShellStore` 读写，`closeOnboarding()` 写入 `localStorage['onboarding_done'] = '1'`，不依赖 `modules/calendar/`

#### Scenario: zoneRegistry 位于 core 供多模块读写
- **WHEN** 日历模块注册月视图日期格子或宠物模块注册小窝并读取区域列表
- **THEN** 双方均从 `@/core/lib/zoneRegistry` 导入，跨模块不直接耦合彼此内部文件

#### Scenario: CalendarView 类型由 core 导出且不反向依赖模块
- **WHEN** `settingsStore.ts` 引用 `CalendarView` 类型
- **THEN** 从自身导出该类型，不导入任何 `modules/` 路径
