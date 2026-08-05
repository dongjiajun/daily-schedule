# Tasks: <!-- 变更名称 -->

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。

  ⚠️ 测试边界提醒：
  涉及以下技术时，单元测试 mock 无法覆盖真实浏览器行为，
  MUST 在 9.4 smoke test 中手工验证：
    - Canvas / WebGL / WASM（如 Rive、Lottie、tsParticles）
    - 文件上传 / 拖拽 / 剪贴板
    - Service Worker / PWA 离线
    - 第三方 SDK 初始化（如微信 JS-SDK）
-->

## 1. 数据库迁移
<!-- 如有新 Flyway 脚本 -->
- [ ] 1.1 编写 V<!-- 版本号 -->__<!-- 描述 -->.sql
- [ ] 1.2 更新 H2 测试 schema（如新增表）
- [ ] 1.3 启动 local MySQL 验证 Flyway 迁移成功

## 2. 领域层 (domain/)
- [ ] 2.1 <!-- Entity / Enum / ValueObject / Repository 接口 / DomainService -->

## 3. 基础设施层 (infrastructure/)
- [ ] 3.1 <!-- persistence: PO + Mapper + RepositoryImpl -->
- [ ] 3.2 <!-- security / notification / scheduled / config（按需） -->
- [ ] 3.3 编写 infrastructure 层单元测试

## 4. 应用层 (application/)
- [ ] 4.1 <!-- ApplicationService 用例编排 -->
- [ ] 4.2 编写应用层单元测试

## 5. API 层 (api/)
- [ ] 5.1 <!-- Controller 实现 generated 接口 -->
- [ ] 5.2 <!-- Assembler DTO↔Domain 转换 -->
- [ ] 5.3 编写 API 层单元测试

## 6. 契约同步
- [ ] 6.1 更新 specs/openapi.yaml
- [ ] 6.2 更新 specs/CHANGELOG.md
- [ ] 6.3 同步版本号: pom.xml + package.json + openapi.yaml
- [ ] 6.4 重新生成后端接口 (mvn compile)
- [ ] 6.5 重新生成前端 SDK (npm run generate:api)

## 7. 前端 (frontend/src/)
- [ ] 7.1 <!-- Zustand store / React Query hooks -->
- [ ] 7.2 <!-- 组件开发 (components/) -->
- [ ] 7.3 <!-- 页面集成 (pages/) -->
- [ ] 7.4 <!-- 样式与动画 -->
- [ ] 7.5 编写/更新 vitest 单元测试（store 单测 + hooks 单测 + 组件渲染测试）
- [ ] 7.6 编写/更新 Playwright E2E 测试（`e2e/*.spec.ts`，覆盖关键用户流程）
- [ ] 7.7 运行 `npm run test:e2e` 确认 E2E 全部通过

## 8. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [ ] 8.1 `docs/frontend/component-catalog.md` — 涉及组件/目录（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 涉及表/字段/领域模型（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 8.3 `docs/api/overview.md` — 涉及端点/契约（新增**或修改**）？→ 更新；未触及 → 核对结论
- [ ] 8.4 `docs/architecture.md` + `CLAUDE.md` — 涉及架构/模块/版本/测试规模？→ 更新；未触及 → 核对结论
- [ ] 8.5 `README.md` — 涉及版本/功能清单？→ 更新；未触及 → 核对结论
- [ ] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [ ] 9.1 `cd backend && mvn test` — 后端单元测试全部通过
- [ ] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [ ] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过
- [ ] 9.4 Smoke test — 启动前后端，浏览器手工验证 mock 无法覆盖的场景
  <!-- 删除下方示例行，逐项替换为本次变更实际影响的用户流程；
       无 UI 影响的变更（纯后端/纯文档）删除全部示例行后直接勾选 9.4 -->
  - [ ] 登录 → 创建日程 → 日历视图显示
  - [ ] 点击宠物 → 互动菜单弹出 → 喂食成功
  - [ ] 切换日/周/月视图 → 日程正确显示
  - [ ] 如有 mock 边界风险（Canvas/WASM/SDK），必须在此验证
