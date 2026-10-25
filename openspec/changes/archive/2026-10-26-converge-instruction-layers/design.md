# Design: converge-instruction-layers

<!-- 参考: docs/architecture.md + AGENTS.md 技术约定 -->

## Context

B1 已完成 schema 三档化与工件链收敛，但**指令层配置**仍臃肿：`openspec/config.yaml` context ~50 行、rules 19 条，其中 15 条与 schema instruction/模板重复（同一规则多处编码）；apply/archive 纪律仍写在 schema `apply.instruction`，未使用官方 1.15 的 `operations.apply/archive.guidance`（advisory，`openspec instructions apply/archive` 会以 "Operation Guidance (advisory)" 透传）；多人协作归档时机未成文。配置会被注入每个 artifact 的指令（token 成本 + 漂移面），官方 legacy-cleanup 指引亦要求 "context 只留项目级事实、artifact 规则入 rules、apply/archive 入 operations"。本变更纯工具链/流程配置，无运行时代码。

约束：
- `openspec/config.yaml` 被 CLI 以 zod 校验（`operations.apply/archive.guidance` 为官方支持字段），格式错误会直接导致指令生成失败。
- 项目规则不得削弱：归档前验证门禁、CI 门禁、三档 schema 选择、模板单源、机制层完整性均需保持。
- 官方 schema 的 `apply.instruction` 与内置 apply skill 静态文案存在冲突风险（Issue #1893），操作纪律应走 operations guidance 而非 schema instruction。

## Goals / Non-Goals

**Goals:**
- context ≤20 行 / ≤1200 字符，只留项目级事实与指针
- rules 19 → 4 条（仅 schema/模板未覆盖的约束）
- apply/archive 纪律迁入 `operations.apply/archive.guidance`；schema `apply.instruction` 收敛为指针
- 归档时机按协作模式成文（PR 合并后归档 / 单人 main 同提交）
- 第 10 检机械守护配置预算，防止再次膨胀

**Non-Goals:**
- 不新增 schema/工件、不改工件链与模板（B1 已完成）
- 不改 CI job 结构（openspec-validation job 内新增检查项）
- 不引入新的第三方依赖（预算解析用正则，不引 YAML 库）

## Decisions

### Decision 1: context 瘦身口径（≤20 行 / ≤1200 字符 + 指针）
- **选择**: context 仅保留"代理无法从代码推断"的项目级事实：一句话技术栈、DDD/契约/用户隔离硬约束、API 真相源、测试环境（H2/MySQL）；其余细节指针指向 `AGENTS.md` 与 `docs/`。
- **理由**: context 注入每个 artifact 指令，是 token 与漂移的主要来源；官方明确 "Include constraints an agent cannot infer by reading the code. Keep general project documentation and discoverable codebase facts out."
- **备选方案**: ① 保持现状（每工件 ~50 行注入、与文档重复）；② 完全清空 context（丢失跨端/隔离等不可推断约束，不采纳）。

### Decision 2: rules 去重口径（19 → 4 条）
- **选择**: 仅保留 4 条 schema/模板未覆盖的约束：① API 契约影响/是否 BREAKING；② DB 变更标注 Flyway 版本号；③ 必须说明所选 workflow schema 档位及理由；④ 涉及认证/权限/用户数据隔离说明安全影响。其余 15 条（DDD 层标注、任务分层顺序、测试/文档清单、docs-check 等）已由 schema instruction/模板覆盖，删除。
- **理由**: 落实既有「规范单源化」要求；rules 与模板重复会导致两处改一处漏，且规则注入与 instruction 冲突时难以裁决。
- **备选方案**: ① 保留全部（维持臃肿）；② 全部删除 rules 只留模板（丢失契约影响评估/档位理由等政策级约束，不采纳）。

### Decision 3: 操作纪律迁 `operations` guidance，schema apply.instruction 指针化
- **选择**: 三档 schema 的 `apply.instruction` 改为一句指针（执行 tasks 全部 checkbox；纪律以 `openspec instructions apply` 的 Operation Guidance 为准）；apply 纪律（顺序勾选/阻塞暂停/遵循 AGENTS.md/verify 门禁）与 archive 纪律（tasks 全勾、test-plan 无 🔴、verify/等效依据、归档后复跑）写入 `config.yaml` 的 `operations.apply/archive.guidance`。
- **理由**: 官方 1.15 新增该 advisory 面并明确 "separate from artifact rules"；可规避 schema instruction 与内置 apply skill 静态文案的冲突（Issue #1893），且三档 schema 共用一段纪律，减少重复。
- **备选方案**: ① 继续写在 schema instruction（三档各写一遍、与官方 apply skill 冲突面）；② 只写在 AGENTS.md（文档层不参与 `instructions apply` 透传，不采纳）。

### Decision 4: 归档时机按协作模式区分
- **选择**: 多人/PR 流：变更 artifacts 与代码同 PR 提交，PR 合并后在 `main` 执行 `/opsx:archive`；单人 main 流：验证完成后同提交或紧邻提交归档；归档独立 commit（`chore(openspec): archive <name>`）并复跑门禁。
- **理由**: 官方 team workflow 推荐"合并后归档"；用户已确认未来可能多人协作，需要明确落点，避免归档提交出现在未合并分支。
- **备选方案**: ① 一律同提交归档（PR 流下归档会进入 PR，主 spec 变更提前落分支）；② 一律合并后归档（单人流多一次提交，成本高）。

### Decision 5: 第 10 检配置预算守卫（正则解析，零依赖）
- **选择**: `scripts/openspec-check.mjs` 新增 `checkInstructionBudget()`：不引 YAML 库，用块状正则从 config.yaml 提取 context 行数/字符数、rules 条目数、operations.apply/archive guidance 条目数；阈值：context ≤20 行且 ≤1200 字符、rules ≤8 条、apply/archive guidance 各 ≥1 条。`--self-test` 覆盖 `parseConfigBudget` 正/负例。
- **理由**: 预算不设机械检查会随时间回涨；阈值留余量（当前 10 行/4 条 → 上限 20/8），避免过度约束。正则解析对受控 config 格式足够（config 由本项目维护，非用户输入）。
- **备选方案**: ① 引入 `yaml` 依赖（增加依赖面与安装成本）；② 不做检查仅文档约定（已验证会漂移，不采纳）。

### Decision 6: 升级 SOP 增补官方检查命令
- **选择**: AGENTS.md 升级 SOP 增补 `pnpm exec openspec version --check`（查新版本可用性）与 `pnpm exec openspec update --dry-run`（预演机制层刷新），并保持"改 package.json 版本 → pnpm install → update → openspec:check 全绿 → 提交"主线。
- **理由**: 官方 1.15 提供 `version --check` 与 `update --dry-run`，把"升级前先看有没有新版/会改什么"固化为 SOP，减少盲升。
- **备选方案**: 仅在需要时手动查（易漏，不采纳）。

## DDD Layer Design

无代码层变更（不触碰后端/前端/小程序源码）。

### 领域层 (domain/)
N/A

### 基础设施层 (infrastructure/)
N/A（仅 `openspec/` 配置与 `scripts/` 工具链）

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

- **config.yaml 格式错误导致所有指令生成失败** → 实施后立即冒烟 `openspec instructions proposal/specs/design/tasks --change converge-instruction-layers`；YAML 采用最小改动重写（只动 context/rules/operations）
- **rules 精简过度（政策约束丢失）** → 保留 4 条政策级规则；冒烟时抽查三档 proposal/design 指令含档位理由与安全影响提示
- **第 10 检正则解析误判（缩进变化/注释）** → 解析器只统计受控结构（context 块/rules 列表/operations 两段），`--self-test` 覆盖正负例；失败消息给出预期值便于修复
- **schema apply.instruction 指针化后代理忽略 advisory** → 官方 instructions apply 输出明确标注 "Operation Guidance (advisory)"；同时 AGENTS.md 与归档前验证门禁仍要求 verify/等效依据，机械门禁兜底
- **归档时机变更影响现有流程**（当前单人 main 流）→ 单人流保持"同提交归档"不变，仅新增 PR 流规则，无行为回退

## Review Checklist

- [x] 失败路径是否覆盖？——覆盖：config 解析失败（冒烟）、预算检查误判（self-test + 受控解析）、advisory 被忽略（机械门禁兜底）、rules 精简过度（保留政策级 4 条 + 抽查）
- [x] 回滚/降级方案是什么？——`git revert` 本变更；或仅回滚 `openspec/config.yaml`/`scripts/openspec-check.mjs` 到上一提交；schema apply.instruction 指针可回滚为原文案
- [x] 契约/DB 兼容性影响？——无：`specs/openapi.yaml` 不变、无 Flyway 迁移、无客户端兼容问题

## Migration Plan

1. 重写 `openspec/config.yaml`（context/rules/operations；schema 保持 standard）
2. 三档 schema `apply.instruction` 指针化（custom/standard/lite）
3. `openspec-check` 加第 10 检 + `--self-test`
4. AGENTS.md（指令层说明/十检/归档时机/升级 SOP）与 docs/architecture.md 同步
5. 验证：`openspec instructions apply/archive --change converge-instruction-layers` 显示 Operation Guidance；`openspec schema validate` ×3；`openspec:check` 十检；`validate --all --strict`；`validate --archived`；`docs:check`
6. 归档后复跑门禁；提交推送

回滚：`git revert` 本变更即可整体回退；config.yaml 单独回滚不影响 schema/模板。

## Open Questions

- 官方若把 `operations` guidance 也纳入 schema 层（每 schema 独立 advisory），是否改为 schema 内维护以避免 config 与 schema 耦合？（留待升级评估）
- 多 agent 协作时的 `review` 工件仍在观察，不在本变更范围
