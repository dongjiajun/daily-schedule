# Design: 主 specs 结构格式修复

## Context

OpenSpec 主 spec 解析器要求每个 spec.md 具备两个必选段：`## Purpose`（一句话说明能力目的）与 `## Requirements`（需求列表，每个需求含 `### Requirement:` 头 + 至少一个 `#### Scenario:` 块）。

当前 12 个主 spec 不满足该结构，分两类：
1. **缺 `## Purpose`**（11 个）— 两种来源：① 历史归档时 delta 头 `## ADDED Requirements` 原样同步进主目录（7 个：frontend-unit-test-coverage、phase1-e2e-verification、playwright-e2e-infrastructure、precommit-verify、theme-system、version-sync）；② 有 `## Requirements` 但无 Purpose（4 个：lottie-animation-engine、pet-roaming-system、pet-emotion-state-machine、pet-interaction-particle、pet-sidebar-presence — 实为 5 个，含简介文字或直接 Requirements）
2. **需求缺 Scenario**（1 个）— lunar-holidays 的"非农历节日日期空返回"直接写了 WHEN/THEN 列表，无 `#### Scenario:` 包装

**关键约束：**
- 需求语义（Requirement 陈述 + Scenario 内容）零改动
- 仅修复结构：补 `## Purpose` 段、把 delta 头改为 `## Requirements`、为裸 WHEN/THEN 补 Scenario 包装
- 验证标准：`openspec validate --specs` 50/50 全绿

## Goals / Non-Goals

**Goals:**
- 12 个 spec 全部通过 `openspec validate --specs`
- Purpose 表述准确反映能力目的（从文件标题/简介提炼，一句话）
- 为所有缺 Scenario 的需求补齐 Scenario（用现有 WHEN/THEN 内容包装）

**Non-Goals:**
- 不修改任何 Requirement 的语义内容（不改陈述、不改 WHEN/THEN 细节）
- 不合并/拆分/重命名 capability
- 不新增需求（仅 doc-sync-workflow 的"结构有效性"防护需求除外）
- 不动 docs/ 下普通文档（属另一治理域）

## Decisions

### Decision 1: Purpose 内容来源
- **选择**: 从 spec 标题 + 首段简介文字提炼一句话（如 pet-roaming-system 的简介"宠物游走引擎 — 宠物以独立角色形式在页面自由移动，替代固定卡片"直接转为 Purpose）
- **理由**: 简介文字即为作者意图的精炼表达，零语义猜测；无简介的文件（precommit-verify、theme-system）从 Requirement 集合反推能力目的
- **备选方案**: 统一写"描述 <capability> 能力" — 否决，过于空洞，降低 Purpose 的信息价值

### Decision 2: delta 头修复方式
- **选择**: `## ADDED Requirements` → `## Purpose`（新段）+ `## Requirements`，需求内容原样保留
- **理由**: 主 spec 中 delta 头不合法（解析器只认 `## Requirements` 段内需求），且需求本就是主 spec 的常驻内容（非增量）
- **备选方案**: 保留 delta 头 + 加 Purpose — 否决，delta 头在主 spec 中直接导致解析失败（本次 13 个失败的根因）

### Decision 3: 缺失 Scenario 的包装方式
- **选择**: 为 lunar-holidays"非农历节日日期空返回"的裸 WHEN/THEN 列表补充 `#### Scenario: 非节日日期返回空` 块，WHEN/THEN 内容原样移入
- **理由**: 内容已有，仅缺结构包装；语义不变
- **备选方案**: 改写 Scenario 内容 — 否决，违反"内容零改动"约束

### Decision 4: 防护需求（防回潮）
- **选择**: 在 doc-sync-workflow 主 spec 增加"主 specs 结构有效性"需求，要求所有主 spec 通过 `openspec validate --specs`
- **理由**: 本次 13 个失败长期未被发现，说明没有显式约束检查；归档 sync 后应验证主 specs 全绿
- **备选方案**: 不加防护 — 否决，同类问题必然复发

## DDD Layer Design
无影响（纯 OpenSpec 元文档修复）。

## API Design
无变更。

## Database Design
无变更。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Purpose 表述与能力意图偏差 | 从既有简介文字提炼，不新增语义；apply 后 validate + 抽查 |
| 误改需求内容 | 修复仅涉及文件头部（Purpose 段）与单个 Scenario 包装；apply 后 git diff 逐文件核对 |
| 归档 sync 再次引入 delta 头 | 防护需求（Decision 4）+ 归档后运行 validate --specs 全绿检查 |

## Migration Plan

纯文档修复，无部署步骤。提交信息: `docs: 修复 12 个主 spec 结构（补 Purpose/Scenario）+ 归档 spec-format-repair`

## Open Questions

无。
