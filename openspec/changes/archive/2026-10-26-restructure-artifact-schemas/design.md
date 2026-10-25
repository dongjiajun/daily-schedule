# Design: restructure-artifact-schemas

<!-- 参考: docs/architecture.md + AGENTS.md 技术约定 -->

## Context

当前项目 schema 只有两档：lite（3 工件）与 custom（5 工件，强制 design+test-plan）。数据事实：70 个归档 63 个 custom，design 平均 117 行，test-plan 真实使用 0 次；最近 8 个变更全部 lite。两 schema 共享模板靠手工"单源同步"，`custom` 与 `lite` 的 proposal/spec 模板已实际分叉。OpenSpec 1.15 官方指引：变更要 right-size、tasks 组内自带测试/文档、archive 步骤放入 `## Workflow follow-up`、社区 anvil 模式用"等价机械验证"处理无测试面变更。本变更是纯工作流/schema 重构，无运行时代码与契约变更。

约束：
- 官方无 schema `extends:`/部分覆盖（Discussion #1587），三档只能各自全量 schema 目录，因此必须用机械同步脚本兜底模板单源。
- 既有项目规则不得削弱：文档同步阶段（doc-sync-workflow spec）、归档前验证门禁、`openspec validate --all --strict` 全绿、`openspec-check` 阻断 CI。
- 变更自身必须走完整 custom 链（dogfood：本变更即 test-plan 双模式的首次真实使用）。

## Goals / Non-Goals

**Goals:**
- 三档 schema 让 ceremony 与变更风险匹配：lite（小）/ standard（中，默认）/ custom（复杂，含 test-plan）
- test-plan 双模式：有测试面走命名测试账本；无测试面走等价机械验证清单
- 模板单源机械化（脚本 + CI 第 9 检），消除手工同步漂移
- tasks/design 模板对齐 1.15 实践，降低"最后阶段集中返工"

**Non-Goals:**
- 不引入 `review` 工件（多 agent 对抗评审留待有第二模型时再评估）
- 不改动现有已归档变更与主 spec 的业务能力
- 不重构 `openspec-check` 的既有 8 项检查（只新增第 9 项）
- 不做 config context/rules 收敛（留给 B2 `converge-instruction-layers`）

## Decisions

### Decision 1: 三档划分与默认值（standard 为默认）
- **选择**: 新增 `spec-driven-custom-standard`（proposal→specs→design→tasks）；`openspec/config.yaml` 默认 schema 改为 standard；custom 保留五工件（含 test-plan）作为复杂/高风险显式选用；lite 保持小变更 opt-in。
- **理由**: 63/70 变更走 custom 但 test-plan 0 使用，说明"中等变更"被强制加仪式；standard 覆盖"需要 design 但不需要红绿账本"的主流场景，默认值应落在最常用档位。
- **备选方案**: ① 默认保持 custom、standard 仅 opt-in——改动最小但"流程重"问题不解决；② 两档不变、把 test-plan 改为可选（官方 schema 不支持 optional artifact，无法实现）；③ 合并 lite/standard 为一档——标准档需 design，lite 明确不需要，合并会让小变更重新变重。

### Decision 2: test-plan 双模式而非新增工件
- **选择**: test-plan 仅 custom 保留，instruction/模板定义模式 A（有测试面：场景↔命名测试、红绿翻转）与模式 B（无测试面：场景↔等价机械验证项，如 `pnpm run openspec:check` 第 N 检、`openspec schema validate`）；表格前两列保持 `Requirement | Scenario` 以兼容 CI 第 6 检解析。
- **理由**: CI 第 6 检已强制"每个 delta 场景必须有一行映射"，双模式在保留该门禁的同时让工具链/文档类复杂变更不再被迫虚标测试文件；免新增工件、免改 schema 依赖链。
- **备选方案**: ① 把 test-plan 合并进 tasks（丢失场景↔验证的可审计映射）；② 每档都带 test-plan（把仪式扩散到 standard，与目标相反）；③ 对无测试面变更关闭第 6 检（削弱门禁，不采纳）。

### Decision 3: 模板单源用脚本 + CI 机械校验
- **选择**: `scripts/sync-schema-templates.mjs` 以 custom 模板为源，`--write` 复制到 standard/lite（proposal/spec → 两档，design → standard），`--check` 供 CI；`openspec-check` 第 9 检调用 `--check` 阻断漂移。
- **理由**: 官方 schema 无共享机制（#1587），手工同步已实际分叉；用可执行脚本把"约定"变"校验"，与项目既有机械门禁哲学一致。
- **备选方案**: ① 继续手工同步（已在漂移）；② git symlink（Windows checkout 不可靠）；③ 用构建步骤生成模板（增加复杂度，且 openspec CLI 读盘时需要真实文件）。

### Decision 4: tasks 分组保留固定编号 + Workflow follow-up
- **选择**: custom 保留 1-9 固定组（补领域层测试任务），standard/lite 为 1 实施 / 2 文档同步 / 3 全量验证；三档末尾都加 `## Workflow follow-up` 纯 bullet（verify/archive/归档后门禁复跑，非 checkbox）。
- **理由**: 项目约定（归档前验证门禁）引用"custom 第 9 组 / lite 第 3 组"编号，保留编号避免连带改 spec；文档同步组保留是 doc-sync-workflow spec 的硬要求；Workflow follow-up 落实 1.15 官方"归档步骤不做 checkbox 任务"的实践。
- **备选方案**: ① 完全按官方的扁平组（丢弃项目 DDD/文档同步编排，回归默认 schema 文案）；② 把文档同步拆进每层组（削弱逐项核对纪律，且与现有 spec 冲突）。

### Decision 5: 新档命名与变更自身 schema
- **选择**: 命名 `spec-driven-custom-standard`（保持 `spec-driven-custom` 前缀族）；本变更自身用 custom（五工件）创建并 dogfood test-plan 模式 B。
- **理由**: 前缀族便于发现/文档聚合；自身用 custom 可真实演练双模式，且 design 决策确有架构级内容。
- **备选方案**: ① 命名为 `spec-driven-standard`（脱离项目前缀，易与官方混淆）；② 本变更用 lite 创建（省事但无法 dogfood 新模式，且改动跨多能力）。

## DDD Layer Design

无代码层变更（不触碰后端/前端/小程序源码）。schema/模板/脚本层的决策见上。

### 领域层 (domain/)
N/A

### 基础设施层 (infrastructure/)
N/A（仅 `scripts/` 工具链与 `openspec/` 工作流资产）

### 应用层 (application/)
N/A

### API 层 (api/)
N/A

### 前端 (frontend/src/)
N/A

## API Design

N/A（无端点变更，`specs/openapi.yaml` 不变）

## Database Design

N/A（无表结构变更、无 Flyway 迁移）

## Risks / Trade-offs

- **默认 schema 变更影响后续变更工件数** → AGENTS.md 写明三档选择规则；历史变更不受影响（各自 `.openspec.yaml` 固化 schema）
- **模式 B 弱化"先红后绿"纪律** → CI 第 6 检仍强制逐场景映射 + Coverage Notes 必须写明等价验证方式；人工评审抽查
- **同步脚本误覆盖自有模板**（standard/lite tasks 是自有文件）→ 脚本共享清单只列 proposal/spec/design（不含 tasks/test-plan），硬编码白名单
- **第 9 检需要 node 子进程调用脚本** → 脚本零依赖、路径基于自身位置解析；CI job 已有 node
- **三档增加维护面** → 以脚本 + 双检（第 8/9 检）机械兜底，并将模板数量控制为 4 类

## Migration Plan

1. 新增 standard schema 目录与模板（子代理/本变更 tasks 实施）
2. 更新 custom/lite schema instruction 与模板；跑 `sync-schema-templates.mjs --write` 同步共享模板
3. `openspec/config.yaml` 默认 schema 改为 standard；AGENTS.md 更新三档规则与九检说明
4. `openspec-check` 加第 9 检；`--self-test` 覆盖新解析逻辑
5. 验证：3 个 `openspec schema validate`、`pnpm exec openspec instructions <artifact> --schema <tier>` 冒烟、`validate --all --strict`、`validate --archived`、`openspec:check`、`docs:check`
6. 归档后复跑门禁；提交推送

回滚：`openspec/config.yaml` 默认 schema 改回 `spec-driven-custom`；删除 standard schema 目录与第 9 检；共享模板回滚到上一提交（`git revert` 本变更即可整体回退）。

## Open Questions

- 官方未来若支持 schema `extends:`（Discussion #1587），是否把三档收敛为 extends 继承以进一步降低维护面？（留待升级评估）
- 多 agent 协作时的 `review` 工件是否值得引入？（本变更 Non-Goal，留待人数/模型数增加后评估）
