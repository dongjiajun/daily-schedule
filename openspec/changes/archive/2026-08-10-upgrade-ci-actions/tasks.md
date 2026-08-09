# Tasks: upgrade-ci-actions

## 1. 数据库迁移
- [x] N/A — 无 Flyway 迁移

## 2. 领域层 (domain/)
- [x] N/A — 无后端变更

## 3. 基础设施层 (infrastructure/)
- [x] N/A — 无后端变更

## 4. 应用层 (application/)
- [x] N/A — 无后端变更

## 5. API 层 (api/)
- [x] N/A — 无后端变更

## 6. 契约同步
- [x] N/A — 无 API 契约变更

## 7. CI 配置
- [x] 7.1 修改 `.github/workflows/ci.yml` — `actions/checkout@v4 → v5`（4 处）、`actions/setup-node@v4 → v5`（3 处）、`actions/setup-java@v4 → v5`（2 处）、`pnpm/action-setup@v4 → v6`（2 处）
- [x] 7.2 本地核对 workflow YAML 语法（action 引用合法）— YAML 解析通过，11 处引用全部为升级后版本

## 8. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 8.1 `docs/frontend/component-catalog.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.3 `docs/api/overview.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 未触及（CI 流程结构/门禁分层不变，仅 action 版本升级，不改变文档描述）；核对结论：现有描述仍准确
- [x] 8.5 `README.md` — 未触及；核对结论：现有描述仍准确
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 提交并推送 → CI 五层门禁全部通过（run #76：Version Sync / Backend / Frontend / E2E 全 success；注：run #75 首次推送因 setup-node v5 自动缓存失败，已加 `package-manager-cache: false` 修复，见 design Decision 2）
- [x] 9.2 检查 CI annotations — 弃用警告清零（run #76 全部 job 共 0 annotations，无 "Node.js 20 is deprecated" / "setup-java v4 is deprecated"）
- [x] 9.3 本地 `cd frontend && pnpm run verify` — 无代码变更，快速确认未受配置改动影响（本会话早前已全绿，配置改动不影响前端代码）
