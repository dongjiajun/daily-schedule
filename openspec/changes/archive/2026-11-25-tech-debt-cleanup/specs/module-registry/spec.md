# Module Registry

## ADDED Requirements

### Requirement: Shell 扩展槽位与模块边界隔离
`ModuleDefinition` SHALL 支持可选槽位 `globalOverlayComponent` 与 `sidebarFooterComponent`，`ModuleRegistry` SHALL 按 `order` 升序通过 `getGlobalOverlays()` 与 `getSidebarFooters()` 收集并由 `AppShell` / `Sidebar` 渲染；`core/`、`components/layout/`、`pages/`、`App.tsx` 与跨模块之间 SHALL NOT 存在直接相互 `import`。

#### Scenario: Shell 通过扩展槽位渲染模块浮层与侧栏底部组件
- **WHEN** `petModule` 声明 `globalOverlayComponent: RoamingPet` 与 `sidebarFooterComponent: SidebarPet` 并注册到 `moduleRegistry`
- **THEN** `AppShell` 通过 `getGlobalOverlays()` 渲染 `RoamingPet`（包裹静默 `ErrorBoundary`），`Sidebar` 通过 `getSidebarFooters()` 渲染 `SidebarPet`，按模块 `order` 升序排列

#### Scenario: 静态模块边界守卫检测零越界引用
- **WHEN** 静态边界测试扫描 `frontend/src/`（排除 `__tests__` 与 `main.tsx`）的所有 `import` 语句
- **THEN** `core/`、`components/layout/`、`pages/`、`App.tsx` 中无指向 `modules/` 的导入，且各 `modules/<A>/` 中无指向其他 `modules/<B>/` 的导入
