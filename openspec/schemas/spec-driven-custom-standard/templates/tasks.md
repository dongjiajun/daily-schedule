# Tasks: <!-- 变更名称 -->

<!--
  STANDARD 工作流（spec-driven-custom-standard）：1 实施 → 2 文档同步 → 3 全量验证，共三组。
  实施按 design.md 的 Decision 顺序、分 DDD 层落地，每层条目自带对应测试，不把测试堆到第 3 组。
  第 3 组后的 Workflow follow-up 为纯 bullet，不是 checkbox 任务。
-->

## 1. 实施
<!-- 按 design.md 的 Decision 顺序排列；每层自带对应测试任务 -->
- [ ] 1.1 数据库迁移（如涉及）：编写 V<!-- 版本号 -->__<!-- 描述 -->.sql + 更新 H2 测试 schema + local MySQL 验证
- [ ] 1.2 领域层 (domain/)：<!-- Entity / Enum / ValueObject / Repository 接口 / DomainService --> + 编写领域层单元测试
- [ ] 1.3 基础设施层 (infrastructure/)：<!-- persistence: PO + Mapper + RepositoryImpl；security/notification/scheduled/config（按需） --> + 编写 infrastructure 层单元测试
- [ ] 1.4 应用层 (application/)：<!-- ApplicationService 用例编排 --> + 编写应用层单元测试
- [ ] 1.5 API 层 (api/)：<!-- Controller 实现 generated 接口 + Assembler DTO↔Domain 转换 --> + 编写 API 层单元测试
- [ ] 1.6 契约同步（如涉及）：更新 `specs/openapi.yaml` + `specs/CHANGELOG.md` + 同步版本号 + 重新生成后端接口/SDK
- [ ] 1.7 前端 (frontend/src/)：<!-- store / 组件 / 页面 / 样式 --> + vitest 单元测试 + Playwright E2E

## 2. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [ ] 2.1 `docs/frontend/component-catalog.md` — 涉及组件/目录（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 涉及表/字段/领域模型（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.3 `docs/api/overview.md` — 涉及端点/契约（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 2.4 `docs/architecture.md` + `AGENTS.md` — 涉及架构/模块/版本/测试规模？→ 更新；未触及 → 核对结论
- [ ] 2.5 `README.md` — 涉及版本/功能清单？→ 更新；未触及 → 核对结论
- [ ] 2.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 3. 全量验证
- [ ] 3.1 `cd backend && mvn test` — 后端单元测试全部通过
- [ ] 3.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [ ] 3.3 `cd frontend && npm run test:e2e` — 涉及 Web 用户流程时执行；无 UI 变更写明跳过结论
- [ ] 3.4 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景；无 UI 影响删除示例行后勾选
  - [ ] 登录 → 创建日程 → 日历视图显示
  - [ ] 切换日/周/月视图 → 日程正确显示
- [ ] 3.5 `pnpm run openspec:check` — OpenSpec 一致性 + 归档完整性通过

## Workflow follow-up
<!-- 纯 bullet，不是 checkbox 任务：不参与 apply 进度统计，归档前按序执行并留痕 -->
- `/opsx:verify` — 代码变更必备（真实代码变更须报告无 CRITICAL；纯工具链/文档变更按第 3 组等效依据说明）
- `/opsx:archive` — 归档已完成的变更
- 归档后复跑门禁：`pnpm run openspec:check` + `openspec validate --archived`
