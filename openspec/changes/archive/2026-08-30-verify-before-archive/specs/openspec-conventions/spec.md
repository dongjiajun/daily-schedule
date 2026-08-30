<!-- 单源同步：与 spec-driven-custom/templates/spec.md 内容一致（custom 为先，修改须两处同步） -->
# OpenSpec 工作流约定（openspec-conventions）

<!-- 参考: openspec/specs/openspec-conventions/spec.md（已存在能力，delta 不携带 Purpose） -->

## ADDED Requirements

### Requirement: 归档前验证门禁
项目 OpenSpec 工作流 SHALL 在归档前执行验证门禁：

1. **真实代码变更**（触碰 `backend/`、`frontend/src/`、`apps/miniprogram/` 或 `packages/` 下源码）在 apply 后归档前 SHALL 运行 `/opsx:verify`（`openspec-verify-change`，输出 Completeness/Correctness/Coherence 三维报告）；报告 SHALL 无 CRITICAL 级别问题方可归档，存在 CRITICAL 时 SHALL 修复后重跑 `/opsx:verify` 并确认无 CRITICAL 再归档。
2. **纯工具链/文档/元数据变更**（无源码行为变化）SHALL NOT 跳过验证，但可由 tasks 全量验证组套件（custom 第 9 组 / lite 第 3 组：`openspec validate --all --strict`、`pnpm run openspec:check`、`pnpm run docs:check` 及相关测试回归）加 `validate --archived` 等效替代；归档条目 SHALL 注明等效依据（如"零代码变更，全量验证组套件 + validate --archived 全绿"）。

该门禁不改变任务的执行方式——任务勾选仍以实际完成为准；门禁只约束"归档动作"的前置状态。

#### Scenario: 代码变更 verify 通过后归档
- **WHEN** 变更触碰源码，apply 后运行 `/opsx:verify` 且报告无 CRITICAL
- **THEN** 允许执行归档，归档条目记录 verify 结论（无 CRITICAL 即通过）

#### Scenario: 存在 CRITICAL 时归档被拦截
- **WHEN** `/opsx:verify` 报告存在 CRITICAL 级别问题（如任务未完成、spec 与实现不一致）
- **THEN** 归档 SHALL 中止；修复问题并重跑 `/opsx:verify` 至无 CRITICAL 后方可归档，不得以 `validate --archived` 代替 verify 结论

#### Scenario: 工具链变更等效替代验证
- **WHEN** 变更不触碰源码（纯工具链/文档/元数据），归档前未运行 `/opsx:verify`
- **THEN** 变更以 tasks 全量验证组套件 + `validate --archived` 等效验证，归档条目注明等效依据，`openspec validate --archived` 通过

## Test Coverage
<!-- 可选。回填历史 spec 时用于审计现有测试覆盖；新建 spec 时可留空，apply 阶段再填充。 -->

| Scenario | 测试类 | 测试方法 | 状态 |
|----------|--------|----------|------|
| 代码变更 verify 通过后归档 | /opsx:verify | 人工核对（apply 阶段执行） | ⚠️ 缺少覆盖(需补测试) |
| 存在 CRITICAL 时归档被拦截 | /opsx:verify | 人工核对（apply 阶段执行） | ⚠️ 缺少覆盖(需补测试) |
| 工具链变更等效替代验证 | scripts/openspec-check.mjs + validate --archived | CLI 校验 | ➕ 本次新增 |

<!-- 状态: ✅ 已有覆盖 / ⚠️ 缺少覆盖(需补测试) / ➕ 本次新增 -->
