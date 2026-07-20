# Tasks: Monorepo Foundation

<!-- 纯项目结构/构建系统变更，不涉及后端 DDD、数据库、API 契约 -->

## 1. Monorepo 基础结构

- [x] 1.1 创建根 `package.json`（`private: true`，scripts 委托 `turbo run`）
- [x] 1.2 创建 `pnpm-workspace.yaml`（声明 `frontend` + `packages/*`）
- [x] 1.3 创建 `turbo.json`（`build` 依赖 `^build`，`verify` 依赖 `lint build test`）
- [x] 1.4 创建 `.npmrc`（`engine-strict=true`，强制 pnpm）
- [x] 1.5 根目录 `pnpm install` 验证 workspace 解析正确

## 2. Shared 包创建

- [x] 2.1 创建 `packages/shared/package.json`（`@daily-schedule/shared`，`type: module`，`tsc` 构建）
- [x] 2.2 创建 `packages/shared/tsconfig.json`（ESM 输出到 `dist/`，生成 `.d.ts`）
- [x] 2.3 创建 `packages/shared/src/types/event.ts`（`EventStatus` 类型定义）
- [x] 2.4 创建 `packages/shared/src/types/index.ts`（barrel export）
- [x] 2.5 创建 `packages/shared/src/constants/colors.ts`（`PRESET_COLORS`）
- [x] 2.6 创建 `packages/shared/src/constants/api.ts`（API 端点路径常量）
- [x] 2.7 创建 `packages/shared/src/constants/index.ts`（barrel export）
- [x] 2.8 创建 `packages/shared/src/index.ts`（顶层 barrel export）
- [x] 2.9 `cd packages/shared && pnpm run build` 验证独立构建通过

## 3. Frontend 接入 Shared

- [x] 3.1 `frontend/package.json` 添加 `"@daily-schedule/shared": "workspace:*"` 依赖
- [x] 3.2 `frontend/tsconfig.app.json` 添加 shared 包 project reference（`"references": [{ "path": "../packages/shared" }]`）
- [x] 3.3 `pnpm install` 验证 shared 包正确链接到 frontend 的 node_modules

## 4. 代码提取与 Import 迁移

- [x] 4.1 `frontend/src/lib/colors.ts` 改为 re-export 兼容层（`export { PRESET_COLORS } from '@daily-schedule/shared'`）
- [x] 4.2 迁移 `components/event/EventForm.tsx` — `PRESET_COLORS` import 改为 `@daily-schedule/shared`
- [x] 4.3 迁移 `components/event/EventModal.tsx` — 无直接 EventStatus import，跳过
- [x] 4.4 迁移 `components/calendar/CalendarView.tsx` — 无直接 EventStatus import，跳过
- [x] 4.5 迁移 `components/layout/ManageDialog.tsx` — `PRESET_COLORS` import 改为 `@daily-schedule/shared`
- [x] 4.6 迁移 `hooks/useEvents.ts` — 无直接 EventStatus import，跳过
- [x] 4.7 迁移 `store/calendarStore.ts` — 无 EventStatus import，跳过

## 5. CI 适配

- [x] 5.1 检查 `.github/workflows/` 现有 CI 配置，确认是否需要适配 pnpm
- [x] 5.2 CI workflow 适配：pnpm/action-setup + `pnpm install --frozen-lockfile` + shared 构建
- [x] 5.3 如无 `.github/workflows/`：跳过此分组（已有，已适配）

## 6. 全量验证

- [x] 6.1 根目录 `turbo run build` 全量构建通过（shared → frontend 顺序正确）
- [x] 6.2 `cd frontend && pnpm run verify`（lint + build + test）全部通过（15 tests）
- [x] 6.3 `cd backend && mvn test` 不受影响，全部通过（185 tests）
- [x] 6.4 手动冒烟：`pnpm run dev` 启动 → 登录 → 创建/编辑/删除日程 → 确认日历功能零退化

## 7. 文档同步（必须检查）

- [x] 7.1 架构变动 → 更新 `docs/architecture.md`（补充 Monorepo 结构说明）
- [x] 7.2 架构变动 → 更新 `CLAUDE.md`（补充 Monorepo 开发命令：`pnpm install`、`turbo run build` 等）
- [x] 7.3 无新前端组件 → 跳过 `docs/frontend/component-catalog.md`
- [x] 7.4 无新实体/表/字段 → 跳过 `docs/database/schema.md` + `docs/uml/README.md`
- [x] 7.5 无新 API 端点 → 跳过 `docs/api/overview.md`
