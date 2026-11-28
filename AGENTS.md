# AGENTS.md

日程管理系统 — Spring Boot 3.4 + React 19 + MySQL 8.0 + Taro 4.2 微信小程序 + `@daily-schedule/shared`。

## OpenSpec 工作流（强制）

使用 **OpenSpec CLI 1.15.0**（版本单源：根 `package.json` 精确锁定）进行 artifact-driven 开发；所有变更均走此流程，按影响选取三档 schema 并在 `proposal.md` 注明理由：

```
/opsx:new <name> → proposal → specs → design → test-plan → tasks → /opsx:apply → /opsx:verify → /opsx:archive
```

- **Schema 选型**：默认 `spec-driven-custom-standard`（proposal → specs → design → tasks）；纯单模块小改/工具链/文档用 `--schema spec-driven-custom-lite`（proposal → specs → tasks）；跨模块/新架构/迁移/安全性能/需红绿测试账本用 `--schema spec-driven-custom`（含 `test-plan.md`）。无行为变化变更（工具链/文档/纯重构）在 `.openspec.yaml` 设 `skip_specs: true`。
- **指令层权威**：撰写工件、执行 apply 与 archive 前，以 `openspec instructions <artifact|apply|archive> --change <name>` 的动态输出与 `openspec/config.yaml` 的 `operations.*.guidance` 为唯一指引；机制层位于入库目录 `.agents/skills/`（CLI 升级经 `pnpm exec openspec update` 重生成后提交，`.dsh/` 仅本机个人技能且不入库）。
- **delta 规范**：新能力 delta 必须以 `## Purpose`（≥50 字符）开头，已存在能力 delta 省略 `## Purpose` 且需求正文 ≤500 字符。
- **归档与提交门禁**：
  - 触碰 `backend/`、`frontend/src/`、`apps/miniprogram/`、`packages/` 源码的变更，归档前必须执行 `/opsx:verify` 且报告无 CRITICAL；纯工具链/文档/元数据变更以第 3 组全量验证 + `openspec:check` 等效替代并在归档条目注明依据。
  - 多人/PR 流在 PR 合并回 `main` 后归档；单人 `main` 流先提交功能变更，再用独立 commit（`chore(openspec): archive <name>`）归档，归档后复跑 `pnpm run openspec:check` 与 `pnpm run docs:check`（仅在用户明确要求时 `git push`）。

## 上下文与会话纪律

- **隔离长输出与大调研**：跨 `>5` 个文件的代码库检索委托 `research` subagent；全量验证（`pnpm run verify`、`mvn test`、Playwright E2E）及失败归因委托 subagent 执行，主会话只接收「通过数 + 失败用例 + 根因栈」。
- **OpenSpec 节点切会话**：中大型变更在 `tasks.md` 定稿后（进入 `/opsx:apply` 前）以及每次 `/opsx:archive` 完成后，主动提醒用户开启新会话（或在上下文超过 250K–300K 时执行 `/compact`），以 `openspec/changes/<name>/` 作为无损外置记忆保持主窗口轻量聚焦。

## 分级验证与环境约定

本地提交前按变更影响面选跑静默命令（CI `.github/workflows/ci.yml` 负责全量五道阻断门禁兜底）：

| 变更影响面 | 本地必跑验证 |
|---|---|
| 仅 `frontend/` | `pnpm run ui:check` → `pnpm run verify:frontend`（涉及 Web 流程时加 `pnpm run test:e2e`，跳过 `mvn test` 与小程序） |
| `backend/` 或 `specs/openapi.yaml` | `cd backend; mvn -s D:\self_maven_conf\settings.xml "-Dmaven.compiler.source=21" "-Dmaven.compiler.target=21" -q -B test`（单类加 `-Dtest=ClassName`）；改 OpenAPI 时复核 `frontend` SDK freshness（`pnpm --filter frontend run generate:api`） |
| `packages/shared/` 或 `apps/miniprogram/` | `pnpm run verify:miniprogram` 或全量 `pnpm run verify` |
| 文档 / OpenSpec / 工具链配置 | `pnpm run docs:check` + `pnpm run openspec:check` |

- **静默输出已固化**：根命令与 Vitest/Playwright 默认开启 `--output-logs=errors-only`、本地 `dot` reporter 与 `workers: 2` / `line`（`CI` 环境变量下自动恢复完整输出与默认并发）；视觉基线 `pnpm run test:visual` 仅在 UI/主题视觉改动时于本地执行，快照全量刷新用 `pnpm exec playwright test --grep '@visual' --update-snapshots=all`。
- **Windows PowerShell 5.1 & 本地环境**：用 `; if ($LASTEXITCODE -eq 0) { ... }` 串联命令（不用 `&&`）；`-D...` 参数加双引号，`@visual` 加单引号；后端 dev 启动需本地 MySQL 8.0（服务 `MySQL80`，`root/123456`，库 `daily_schedule_dev` / `daily_schedule_test`；单元测试使用 H2 内存库 `application-test.yml`）；JDK 21 / Node 22。

## 架构硬约束（代码不可直接看出的约定）

- **API 契约单源**：修改端点优先改 `specs/openapi.yaml` → 同步 `specs/CHANGELOG.md`、`backend/pom.xml`、`frontend/package.json` 版本号；后端 Controller 必须实现生成的接口，`frontend/src/api/` 由 `@hey-api/openapi-ts` 全量覆写（自定义拦截与解包只放 `frontend/src/core/lib/`）。
- **前端边界**：所有 SDK 请求通过 `core/lib/unwrap.ts` 抛出后端错误；`core/lib/authInterceptor.ts` 负责 Bearer 注入、30s 预续签单飞锁与 401 登出；跨模块仅通过 `core/lib/eventBus.ts` 通信，禁止 `modules/` 间相互 import；消费共享包用子路径 `@daily-schedule/shared/holiday` 与 `@daily-schedule/shared/pet`。
- **后端安全与隔离**：所有业务表包含 `user_id`，查询强制通过 `CurrentUserService` 过滤；SSE 鉴权走 `dsa_sse_session` HttpOnly Cookie（不使用 `?token=`）；微信小程序登录走 `POST /auth/wechat-login`（`WECHAT_APP_ID`/`WECHAT_APP_SECRET` 环境变量注入，不入库）。

## 文档指针与同步检查

根据任务分支按需加载详细参考（避免预先全量读取）：

| 何时查阅 | 目标文档 |
|---|---|
| 系统分层、模块通信、缓存/日志/PWA、**微信小程序各页面实现细节** | `docs/architecture.md` |
| API 端点清单、响应与错误契约、变更日志 | `docs/api/overview.md`、`specs/CHANGELOG.md` |
| 表结构、Flyway 迁移（V1–V10）、领域模型 UML | `docs/database/schema.md`、`docs/uml/README.md` |
| 前端组件清单、设计 token 契约（23 套主题） | `docs/frontend/component-catalog.md`、`frontend/src/core/styles/design-tokens.json` |
| OpenSpec 三层职责、十项 CI 门禁、CLI 升级 SOP、模板同步 | `openspec/specs/openspec-conventions/spec.md` |
| 阶段规划、快速开始命令 | `docs/planning/execution-plan.md`、`README.md` |

**完成检查（每次变更必填结论，未触及写明“现有描述已核对仍准确”）**：
- 组件/目录 → `docs/frontend/component-catalog.md`；表/领域模型 → `docs/database/schema.md` + `docs/uml/README.md`；API → `docs/api/overview.md`；架构/测试规模 → `docs/architecture.md` + 本文件；版本/功能清单 → 本文件 + `README.md`；样式 token → `design-tokens.json` + `pnpm run ui:check`。提交前运行 `pnpm run docs:check` 与 `pnpm run openspec:check` 校验一致性。

## 当前版本：v3.5.1（2026-08-17）

能力覆盖：Event 状态闭环 / 日历拖拽与标签筛选 / 23 套主题（5 基础 + 18 节日）与 6 种特效 / JWT + SSE Cookie + ICS + PWA + 移动端适配 / 宠物养成（游走・昼夜节律・经济闭环・装扮・状态持久化）/ 三列任务看板 / 微信小程序（登录・日历月视图・任务・宠物）/ 路由懒加载分片。

测试基线：后端 45 类 354 用例（`<!-- DOCS-CHECK: backend-test-classes=45 -->`）+ 前端 59 文件 318 用例（`<!-- DOCS-CHECK: frontend-test-files=59 -->`）+ Playwright E2E 16 文件 75 用例（`<!-- DOCS-CHECK: e2e-files=16 -->`）+ 小程序 8 文件 86 用例 + 共享包 8 文件 117 用例。
