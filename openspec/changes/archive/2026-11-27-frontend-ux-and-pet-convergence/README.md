# frontend-ux-and-pet-convergence

第一阶段前端体验与设计系统收口：`OnboardingGuide` 迁至 Radix `Dialog` 并与全局单实例 `PetSelection` 串行编排（404 停轮询 + 关闭免打扰）；`useSseNotifications` 与全局 `?` 分组快捷键上移至 `AppShell`，`/todo` 补齐 `N`/`1`/`2` 快捷键；修复宠物 SVG 双重缩放、增加侧栏/移动端按钮避让与小窝外侧停靠/悬停上翻/唤醒推出及 `/pet` 去分身；`/pet` 专页收口至设计系统原语并支持纵向滚动、直接玩耍、分区去重与内联改名；同步刷新 5 张 `*-06-pet` 视觉基线。

## 归档记录（2026-11-27）

- **verify 结论**：`spec-driven-custom` 五工件完整，tasks 23/23 全部完成、`test-plan.md` 13/13 场景全部翻绿（0 🔴）、5 份 delta spec 已实现并核对，**0 CRITICAL**。保留 1 项说明：浏览器沙箱沿用共享 Profile 的 `onboarding_done`，首次注册后自动串行触发依赖 Vitest `RoamingPet.test.tsx` 覆盖；手动点侧栏「指南」已实测 `OnboardingGuide` Radix `Dialog` 与 `Escape` 关闭。
- **门禁结果**：`pnpm run verify`（10/10 任务：`@daily-schedule/shared` 117 + `frontend` 58 文件 307 + `@daily-schedule/miniprogram` 86）、`pnpm run ui:check`、Playwright `pnpm run test:e2e`（`--workers=2` 67 passed / 1 pre-existing skip，并发超时 3 条随后经 `todo-board-interaction.spec.ts --workers=1` 9/9 通过）、`pnpm run test:visual`（5/5 通过，30 张截图），以及归档后复跑的 `pnpm run openspec:check`、`pnpm exec openspec validate --archived --strict --no-interactive`（81/81）、`pnpm run docs:check` 与 `./scripts/sync-version.sh --check`（3.5.1）全部通过。
- **delta 同步**：5 个已有主 spec 完成合入（`dynamic-module-routing`、`pet-avatar`、`pet-interaction-ui`、`pet-roaming-system` 新增 1 条 ADDED 需求；`pet-selection` 更新 1 条 MODIFIED 需求），主 spec 保持 72 份，delta 头 0 残留。
