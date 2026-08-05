# Tasks: docs-sync-guarantee

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。
  本变更为流程 + 文档变更：无后端/前端代码改动，核心实施集中在 8. 文档同步分组。
-->

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端领域层变更

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端基础设施层变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无后端 API 层变更

## 6. 契约同步
- [x] 6.1 N/A — 无 API 契约变更（specs/openapi.yaml 不改）
- [x] 6.2 N/A — 无契约变更，无需 CHANGELOG 条目（本变更不升版本号，维持 3.3.4）
- [x] 6.3 N/A — 版本号不动：pom.xml + package.json + openapi.yaml 均维持 3.3.4
- [x] 6.4 N/A — 无契约变更，无需 mvn compile 重新生成
- [x] 6.5 N/A — 无契约变更，无需 generate:api

## 7. 前端 (frontend/src/)
- [x] 7.1 N/A — 无前端代码变更（frontend/src/ 仅作为 docs-check 的计数对象，不修改）

## 8. 文档同步（含流程机制与自动化防线）

### 8A. 自动化检查脚本（scripts/docs-check.mjs）
- [x] 8.1 编写 `scripts/docs-check.mjs`（Node，零依赖，Windows/CI 双环境）：
  - `checkVersion()`：从 `specs/openapi.yaml` 提取 `version`，与 `docs/api/overview.md`（"当前 API 版本"）、`docs/database/schema.md`（"当前状态"）、`docs/planning/execution-plan.md`（"当前实际版本"）、`CLAUDE.md`（"当前版本"）四处声明比对
  - `checkEndpoints()`：提取 openapi 全部 `^  /` 路径（`{id}` 归一化），检查均出现在 `docs/api/overview.md`；反向出现（overview 有而 openapi 无）输出告警 + 脚本常量区白名单（白名单条目须带注释理由）
  - `checkCounts()`：扫描文档中 `<!-- DOCS-CHECK: <key>=<value> -->` marker，对已知 key 从代码树现场重算比对：`frontend-test-files`（glob `frontend/src/**/*.test.*`）、`backend-test-classes`（`backend/src/test/**/*Test.java`）、`domain-files`（`domain/**/*.java`）、`specs-count`（`openspec/specs/` 目录数）、`e2e-files`（`e2e/*.spec.ts`）、`theme-sets`（themes.css `data-theme` 去重）、`holiday-themes`（holiday-themes.css 去重）、`ui-components`（`core/components/ui/` 文件数）
  - 任一不一致 → 非零退出 + 打印"实际值 vs 声明值 vs 应更新文件"修复指引；`--self-test` 模式用故意错误用例自检
- [x] 8.2 root `package.json` 加 `"docs:check": "node scripts/docs-check.mjs"` script
- [x] 8.3 `.github/workflows/ci.yml` version-check job 在版本检查 step 后加 `node scripts/docs-check.mjs` step

### 8B. 存量 6 文档修复（差异矩阵见探索排查；修复后 docs-check 全绿为判据）
- [x] 8.4 修复 `docs/api/overview.md`：版本声明 → 3.3.4；`GET /pets/me` 字段列举补 `currentAccessory`；按需补 404/409 响应细节
- [x] 8.5 修复 `docs/database/schema.md`：版本声明 → 3.3.4；**ER 图补 5 张表**（pets / pet_accessories / pet_interactions / tasks / task_tags 及 user 归属关系）；`event`/`category`/`tag` 的 `user_id` 标注从 "FK → user" 改为"索引"（V2 迁移确认无外键约束）
- [x] 8.6 修复 `docs/uml/README.md`：Pet 方法改为 `applyInteraction(InteractionResult)` / `applyDecay(int, int)` / `isValid()`；**删除虚构的 PetInteraction 类**；补 User→Pet/Task 归属线与 task_tags 关联；**头部加声明**"领域模型图表达实体关系与字段，方法签名以代码为准"
- [x] 8.7 修复 `docs/architecture.md`：SSE 鉴权改 Cookie 描述（删 `?token=` 表述）；前端测试数 45 文件 195 用例、E2E 10 文件 33 用例；domain 类数 28；specs 数 51；CI 门禁描述对齐（version-check/backend/frontend 阻断 + e2e 不阻断）；Bearer 注入位置改 `authInterceptor.ts`；响应契约版本标记更新；shared 包补 `holiday/` + `pet/` 描述；注入 `domain-files=28` / `specs-count=51` / `frontend-test-files=45` / `e2e-files=10` marker
- [x] 8.8 修复 `docs/frontend/component-catalog.md`：ErrorBoundary 路径统一为 `components/layout/`；补 `modules/pet/hooks/usePet.ts`、`modules/pet/store/petStore.ts`、`modules/todo/{hooks,lib,store}` 目录；补 `core/styles/holiday-themes.css`（18 套节日主题）描述；注入 `theme-sets=5` / `holiday-themes=18` / `ui-components=9` marker
- [x] 8.9 修复 `docs/planning/execution-plan.md`：版本声明 → 3.3.4；特效数修正（组件实际 4 种，`leaf` 仅类型定义无组件）；节日主题数 → 18

### 8C. 流程机制修订
- [x] 8.10 修订 `openspec/config.yaml` `rules.tasks`：
  - MODIFIED ×3：新组件/实体表/端点 → 新增**或修改**（含"修改现有组件行为""修改表结构/领域模型""修改现有端点"）
  - ADDED ×3："架构/模块结构/测试规模/版本号变更 → architecture.md + CLAUDE.md + README.md"；"8. 文档同步条目必须逐项评估（未触及类别须写明核对结论），不得仅以'无新增'标记 N/A"；"文档同步完成后必须运行 `node scripts/docs-check.mjs` 且通过"
- [x] 8.11 修订 tasks 模板**双源**（`openspec/schemas/spec-driven-custom/templates/tasks.md` + `schema.yaml` 内嵌模板，按"tasks 模板双源同步维护"需求保持一致）：8.x 改为固定五条逐项评估 + 一条 `node scripts/docs-check.mjs` 验证条目
- [x] 8.12 修订 `CLAUDE.md`：文档检查清单章节改为引用 docs-check 自动化验证 + 扩展 architecture/版本/测试规模覆盖；版本声明与测试覆盖数字核对（3.3.4 / 37 类 257 用例 / 45 文件 195 用例 / E2E 10 文件 33 用例，注入 `frontend-test-files` / `backend-test-classes` / `e2e-files` marker）；核对 README.md 声明与文档索引表，如需更新一并同步

## 9. 全量验证
- [x] 9.1 `node scripts/docs-check.mjs` — 全绿（本变更核心验收判据）
- [x] 9.2 `cd backend && mvn test` — 后端 37 类 257 用例回归通过
- [x] 9.3 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest（45 文件 195 用例）回归通过
- [x] 9.4 N/A — 纯文档/流程变更，无用户流程变化，E2E 由 CI 兜底（本变更不触碰 backend/src、frontend/src、packages/shared 任何业务代码）
- [x] 9.5 `openspec validate --specs` — 主 specs 全绿（doc-sync-workflow delta 已同步）
- [x] 9.6 新模板 smoke：`/opsx:ff` 生成一个临时变更，确认 tasks 的 8.x 为逐项评估条目且 8.x 末含 docs-check 验证行，检查后删除临时变更
- [x] 9.7 归档：`/opsx:archive`（含 delta specs sync 至 `openspec/specs/doc-sync-workflow/spec.md` + `openspec validate --specs`）
