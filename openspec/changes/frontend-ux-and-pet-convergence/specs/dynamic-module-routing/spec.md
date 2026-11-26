# Dynamic Module Routing

## ADDED Requirements

### Requirement: 全站通知常驻与分层键盘快捷键及无障碍引导
`AppShell` SHALL 挂载 `useSseNotifications` 与全局 `?` 快捷键（`useGlobalShortcuts`）以保持跨页面 SSE 连接与帮助弹框可用；`TodoPage` SHALL 支持 `N`（新建任务）与 `1`/`2`（看板/列表切换）；`OnboardingGuide` SHALL 基于 Radix `Dialog` 实现焦点捕获与 `Esc` 关闭。

#### Scenario: 跨模块切页保持 SSE 连接与分层快捷键响应
- **WHEN** 用户从 `/` 切换到 `/todo` 或 `/pet` 并按 `?`，或在 `/todo` 按 `N` / `1` / `2`
- **THEN** SSE 通知订阅持续保持不断连，按 `?` 打开分组快捷键帮助框，`/todo` 内 `N` 打开新建任务弹窗、`1`/`2` 切换看板与列表视图

#### Scenario: 输入框聚焦或弹窗打开时屏蔽快捷键且引导支持 Esc 关闭
- **WHEN** 焦点在输入框内或存在 `[role="dialog"]` 打开时触发全局/模块快捷键，或打开 `OnboardingGuide` 后按下 `Escape`
- **THEN** 快捷键被屏蔽不误触新建或切视图；`OnboardingGuide` 作为 Radix `Dialog` 捕获焦点并响应 `Escape` 关闭引导
