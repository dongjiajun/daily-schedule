# Design: upgrade-ci-actions

## Context
`ci.yml` 中 4 类 action 均为 v4（Node 20 runtime），CI 报告 6 条弃用警告。已确认最新版本：`checkout v7`、`setup-node v7`、`setup-java v5`、`pnpm/action-setup v6`。

## Goals / Non-Goals

**Goals:**
- CI 弃用警告清零，action 全部运行在 Node 24 runtime
- 五层门禁无回归

**Non-Goals:**
- 不重构 CI 工作流结构（job 划分/依赖缓存不变）
- 不升级 Node 版本（项目已用 Node 22/24 setup，`setup-node` 的 node-version 参数不动）

## Decisions

### Decision 1: 目标版本 — checkout/setup-node 升 v5，setup-java 升 v5，pnpm 升 v6
- **选择**: `actions/checkout@v5`、`actions/setup-node@v5`、`actions/setup-java@v5`、`pnpm/action-setup@v6`。
- **理由**: 三个 v5 均为 Node 24 runtime、社区广泛验证的稳定版本（GitHub 弃用公告建议的迁移目标，setup-java 警告原文明确建议 v5）；pnpm/action-setup 行为极简（仅安装 pnpm），直接升 latest v6。不追 checkout/setup-node 的 v7——major 跳升引入的兼容差异超出本次"消除弃用警告"的最小范围。
- **备选方案**: (a) 全部升 latest（checkout v7/setup-node v7）——行为差异风险大于收益；(b) 维持 v4 不动——时间炸弹（未来 Node 20 兼容层移除后 CI 挂）。

## DDD Layer Design
无变更（纯 CI 配置）。

## API Design
无变更。

## Database Design
无变更。

## Risks / Trade-offs
- [v5/v6 行为差异] → checkout/setup-node/setup-java v5 是 GitHub 推荐迁移路径，行为向后兼容；pnpm/action-setup v6 只装 pnpm，风险极低
- [CI 一次性回归] → 推送后检查五层门禁 + annotations 清零

## Migration Plan
1. 修改 `ci.yml` 4 类 action 版本（4 处 checkout、3 处 setup-node、2 处 setup-java、2 处 pnpm/action-setup）
2. 本地 `node scripts/docs-check.mjs`（无文档变更，核对）
3. 提交推送 → CI 验证：五层门禁全绿 + 无弃用警告 annotation
4. `/opsx:archive`
5. 回滚：git revert 单文件，无数据迁移

## Open Questions
- 无。
