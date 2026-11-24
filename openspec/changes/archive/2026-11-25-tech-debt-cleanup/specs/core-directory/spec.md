# Core Directory

## ADDED Requirements

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
