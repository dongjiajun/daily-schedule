# Tasks: frontend-ux-and-pet-convergence

<!--
  按 DDD 分层编排，严格保持 1–9 固定分组。
  前后端仅前端改动，1–6 组明确标记 N/A；每步完成即勾选并翻绿 test-plan.md。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 本变更为纯前端体验与设计系统收口，无数据库表或 Flyway 迁移改动（维持 V1–V10）

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端领域层改动

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端基础设施层改动

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端应用层改动

## 5. API 层 (api/)
- [x] 5.1 N/A — 无后端 API 层改动

## 6. 契约同步
- [x] 6.1 N/A — `specs/openapi.yaml` 维持 `v3.5.1` 不变，无需重新生成前后端 SDK

## 7. 前端 (frontend/src/)
- [x] 7.1 `core/` 与壳层升级：`useSseNotifications` 增环境守卫并上移至 `AppShell`；新增 `useGlobalShortcuts`（含 `isShortcutBlocked`）挂载于 `AppShell`；`ShortcutsDialog` 分组展示；`OnboardingGuide` 迁至 Radix `Dialog`（支持焦点捕获与 `Esc`）
- [x] 7.2 业务快捷键分层：`calendar` 复用 `isShortcutBlocked` 并移除 `HomePage` 重复 SSE 订阅；新增 `modules/todo/hooks/useTodoKeyboardShortcuts.ts`（`N` 新建、`1`/`2` 切视图）并接入 `TodoPage`
- [x] 7.3 宠物 SVG 与弹窗/轮询修复：移除 `OrangeCat`/`ShibaInu` 双重 `scale`；`petStore` 增加 `selectionDismissed` 与 `dismissSelection`；`useMyPet` error 态暂停 30s 轮询；`RoamingPet` 等待 `showOnboarding===false` 再单次触发并移除 `PetPage` 重复 `PetSelection`
- [x] 7.4 宠物避让、去分身与 `/pet` 专页重整：`Sidebar` 与移动按钮加 `data-pet-avoid`，`RoamingPet` 登记 `hard` 避让、修正回窝停靠偏移并在 `/pet` 隐藏浮层；`SidebarPet` 休息态收起重复精灵；`PetStatus`/`FoodActionList`/`PetPage` 收口至设计系统原语并支持纵向滚动、分区去重、直接玩耍与内联改名
- [x] 7.5 编写/更新 Vitest 单测（`SvgAvatar`/`FoodActionList`/`OnboardingGuide`/`PetSelection`/`usePet`/`RoamingPet`/`SidebarPet`/`AppShell`/`PetPage`/`useGlobalShortcuts`/`useTodoKeyboardShortcuts`）
- [x] 7.6 检查并补充 Playwright E2E（确保既有 E2E 全通，补齐 `e2e/pet.spec.ts` 按用例独立用户隔离与 `eat` 时序收紧，并刷新/验证 5 张 `*-06-pet` `@visual` 截图基线）
- [x] 7.7 运行 `pnpm run test:e2e`（70 passed / 1 skipped）与 `pnpm run test:visual -- --update-snapshots && pnpm run test:visual`（5 passed，30 张截图）全部通过

## 8. 文档同步
- [x] 8.1 `docs/frontend/component-catalog.md` — 更新 `OnboardingGuide`、全站 `useSseNotifications`/`useGlobalShortcuts`、`/todo` 快捷键、`RoamingPet`/`SidebarPet` 避让与 `/pet` 专页描述
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型（现有描述已核对仍准确）
- [x] 8.3 `docs/api/overview.md` — 未触及 API 端点/契约（现有描述已核对仍准确）
- [x] 8.4 `docs/architecture.md` + `AGENTS.md` — 前端 Vitest 更新为 58 文件 307 用例及 `frontend-test-files=58` marker；E2E 16 文件 75 用例不变
- [x] 8.5 `README.md` — 未触及版本/快速开始/架构概述（现有描述已核对仍准确）
- [x] 8.6 运行 `pnpm run docs:check` 与 `./scripts/sync-version.sh --check` — 全部通过

## 9. 全量验证
- [x] 9.1 后端无源码改动，确认工作区纯净（`git status` 无 `backend/` 变更）
- [x] 9.2 `pnpm run verify` + `pnpm run ui:check` — 全量 lint + tsc + build + vitest + 设计 token 门禁全部通过
- [x] 9.3 `pnpm run test:e2e` + `pnpm run test:visual` — E2E 与 30 张视觉回归基线全部通过
- [x] 9.4 Smoke test & 门禁终检 — 浏览器实测 `OnboardingGuide` 指南打开/`Escape`、领养弹窗关闭免打扰、`/` `?` 分组快捷键、`/todo` `N`/`1`/`2` 快捷键、`/pet` 无双猫与内联改名/喂食装扮分区、`RoamingPet` 侧栏避让/小窝右侧停靠/底边悬停上翻/唤醒推出及 0 控制台报错（`OnboardingGuide`->`PetSelection` 首次注册串行触发由 Vitest `RoamingPet.test.tsx` 覆盖，因浏览器沙箱共享 Profile 已存 `onboarding_done`），并复跑 `pnpm run openspec:check`

## Workflow follow-up
- `/opsx:verify` — 已执行并确认无 CRITICAL（23/23 任务完成、`test-plan.md` 13 项场景全 🟢）
- `/opsx:archive` — 已同步 5 份主规格并归档至 `openspec/changes/archive/2026-11-27-frontend-ux-and-pet-convergence/`
- 归档后门禁复跑：`pnpm run openspec:check`（全绿）+ `pnpm exec openspec validate --archived --strict --no-interactive`（81/81 通过）+ `pnpm run docs:check`（通过）+ `./scripts/sync-version.sh --check`（3.5.1）
