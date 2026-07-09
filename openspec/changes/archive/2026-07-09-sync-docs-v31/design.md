# Design: 文档同步至 v3.1 并建立防退化机制

## Context

`docs/` 目录是新人入职了解项目的总纲。当前三份文档落后于代码实际状态，根源在于 OpenSpec 工作流缺少文档同步的强制触发点。

## Goals / Non-Goals

**Goals:**
- 三份过时文档修正至 v3.1 实际状态
- tasks 模板内嵌文档检查步骤（不可跳过）
- config.yaml rules 约束文档检查项
- CLAUDE.md 验证流程加入文档检查

**Non-Goals:**
- 不新增 docs/ 文档
- 不改变 OpenSpec schema 结构

## Decisions

### Decision 1: 文档检查放在 tasks 模板"契约同步"之后
- **选择**：tasks 模板阶段顺序：... → 契约同步 → 文档同步 → 清理验证
- **理由**：文档描述的是系统的"当前状态"，应在代码变更完成后在最后检查是否需要同步
- **备选方案**：每个 Phase 后立即检查 → 拒绝：代价过高，且单个 Phase 中间状态不完整

### Decision 2: 规则用 config.yaml 声明
- **选择**：在 `config.yaml > rules > tasks` 中声明文档检查规则
- **理由**：config.yaml 是项目级约束，AI 生成 tasks 时会自动读取并遵守，无需人工记住
- **备选方案**：在 schema.yaml 中加 artifact 级规则 → 过度工程化

## Risks / Trade-offs

- [风险] 规则描述过于泛化导致误触发 → 缓解：规则要精确（"新组件"→ component-catalog.md，"新实体/表"→ schema.md）
- [风险] 小改动也触发文档检查增加工作量 → 接受：检查≠必须更新，无变更则打勾通过

## Migration Plan

1. 创建 sync-docs-v31 变更
2. 修正三份文档
3. 更新 tasks 模板 + config rules + CLAUDE.md
4. 验证新 tasks 模板生成的示例任务包含文档检查步骤
5. archive → openspec/specs/doc-sync-workflow/spec.md
