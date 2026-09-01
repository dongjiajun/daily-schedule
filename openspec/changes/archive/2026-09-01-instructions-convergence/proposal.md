# Proposal: instructions-convergence

## Why
OpenSpec 指令体系实际分三：CLI 版本钉住的机制层（`.dsh/`/`.claude/` 技能命令，`openspec update` 随 CLI 升级重生成）、动态指令层（`openspec instructions <artifact>` 按 schema + `openspec/config.yaml` context/rules 实时生成）、手工文档层（`CLAUDE.md` 工作流节）。现状问题：自定义 schema 的 5 工件链（含 test-plan）从未经动态指令层端到端验证；CLAUDE.md 仍重复撰写工件格式/序列，与动态层各自漂移。本变更验证动态层对自定义 schema 的透传完整性，并把 CLAUDE.md 收敛为"机制层/指令层/文档层"定位 + 指针式描述，消除双重维护。

## What Changes
- **验证（不留痕）**：临时创建 custom schema 变更，跑 `status --json` + `openspec instructions test-plan/design/apply/archive`，确认自定义工件链/指令/规则完整透传（含 test-plan 指令来自 schema.yaml）；验证后删除临时变更
- **CLAUDE.md 工作流节收敛**：新增"指令体系分层"定位（机制层=CLI 升级时 `openspec update` 重生成、禁止手改、schema 变更不触发；指令层=`openspec instructions` 动态输出、来源 schema + config.yaml；文档层=CLAUDE.md 仅保留 CLI 承载不了的流水线/门禁/验证/文档同步约定）；工件撰写指引改为指向 `openspec instructions <artifact>`，不再重复工件格式
- **守卫（`openspec-check.mjs` 第 7 检）**：CLAUDE.md 工件序列声明 ↔ schema 实际链一致性检查（漂移即非零退出）；`openspec-conventions` 主 spec 同步该门禁条款与分层约定
- 纯工具链/文档/元数据变更，**不触碰** backend/frontend/miniprogram/packages 源码，无 API/数据库/版本号变化

## Capabilities

### New Capabilities
无（验证型 + 工具链/文档收敛，不新增能力）。

### Modified Capabilities
- `openspec-conventions`: 新增"指令体系分层与收敛"需求——机制层（`.dsh`/`.claude`）由 `openspec update` 随 CLI 升级重生成、禁止手改；指令层（`openspec instructions`）为工件撰写指引唯一动态来源；CLAUDE.md 工件序列声明 SHALL 与 schema 实际链一致（第 7 检查守）

## API Contract Impact
无影响。不涉及 `specs/openapi.yaml` 端点、schema 或版本号变更（v3.5.1 保持不变）。

## DDD Layer Impact
无影响。纯工具链/文档/验证，不触碰后端任何层级。

## Database Impact
无需 Flyway 迁移。

## Impact
| 范围 | 详情 |
|------|------|
| **更新** | `CLAUDE.md`（工作流节收敛：指令体系分层 + 指针式指引） |
| **更新** | `openspec/specs/openspec-conventions/spec.md`（指令分层约定 + 第 7 检条款） |
| **更新** | `scripts/openspec-check.mjs`（六类检查 → 七类，新增 check 7 CLAUDE.md 序列一致性） |
| **更新** | `docs/architecture.md` + `README.md`（CI 门禁描述补第 7 检；指令分层说明） |
| **验证** | 无产品代码测试；临时 custom 变更验证动态指令透传后删除；`docs-check` + `openspec:check` + `validate --archived` 全绿（等效路径，归档条目注明） |
| **风险** | 低——纯文档与检查脚本；既有 66 归档/69 主 spec 不受影响 |
