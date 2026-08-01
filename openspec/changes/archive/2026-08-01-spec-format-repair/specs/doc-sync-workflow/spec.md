# Doc Sync Workflow

## ADDED Requirements

### Requirement: 主 specs 结构有效性
所有主 spec（`openspec/specs/<capability>/spec.md`）SHALL 通过 `openspec validate --specs`：每个 spec SHALL 包含 `## Purpose` 与 `## Requirements` 两个必选段，每个需求 SHALL 包含至少一个 `#### Scenario:` 块。归档 sync 之后 SHALL 运行 `openspec validate --specs` 确认全绿。

#### Scenario: 归档后主 specs 全绿
- **GIVEN** 变更归档且 delta specs 已同步至 `openspec/specs/` 主目录
- **WHEN** 运行 `openspec validate --specs`
- **THEN** 全部主 spec 通过（无缺失 Purpose / Requirements / Scenario 错误）

#### Scenario: 新 spec 结构不完整时校验失败
- **WHEN** 某主 spec 缺少 `## Purpose` 段或某需求缺少 Scenario 块
- **THEN** `openspec validate --specs` 报告该 spec 无效，直至修复结构
