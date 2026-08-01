# Design: 文档组织清理与 CLAUDE.md 精简

## Context

项目文档分布在 `docs/`（常驻技术参考）、`specs/`（API 契约）、`openspec/`（变更记录）、`memory/`（历史遗留）四处。经过 v3.1 → v3.3.0 多轮迭代后出现冗余（`frontend/README.md` 描述废弃结构、`memory/` 存 v1.1 历史且不被自动加载）、过时（规划文档中 CI 门禁数/测试数停留在 Phase 0）、双轨（规划文档称 v4.5 就绪、实际契约版本 v3.3.0）三类问题。

**关键约束：**
- 零代码变更 — 不触碰 `specs/openapi.yaml`、后端、前端源码、测试
- 文档同步检查（CLAUDE.md 文档检查段落 + config.yaml rules + tasks 模板）是项目铁律，精简 CLAUDE.md 时必须保留全部核心约束
- `README.md` 文档索引表引用被删文档时需同步更新
- 版本号三处契约（openapi.yaml / pom.xml / package.json）**保持不变**（v3.3.0）

## Goals / Non-Goals

**Goals:**
- docs/ 目录只保留"当前真值"，一次性记录（验收报告）归 OpenSpec 归档
- 删除全部冗余文档（frontend/README.md、memory/、vision-roadmap-draft.md）
- 规划文档合并到 `docs/planning/`，带状态标记，数字与实际一致
- 版本号双轨消歧：规划版本声明为内部代号，与契约版本独立演进
- CLAUDE.md 从 225 行精简至 ~160 行（官方建议上限 200 行内），保留全部核心约定

**Non-Goals:**
- 不修改 specs/openapi.yaml 及三处版本号
- 不重写 docs/architecture.md、api/overview.md、database/schema.md、uml/README.md、component-catalog.md 的内容（本次只做组织调整，内容修订属其他 change）
- 不修改 openspec/config.yaml 与 tasks 模板（已在上次提交中更新至五层门禁，无需改动）
- 不创建新 capability，仅修订 doc-sync-workflow

## Decisions

### Decision 1: docs/ 生命周期原则 — "当前真值"与"归档"分离

- **选择**: docs/ 只保留反映当前状态的参考文档；历史决议、一次性验收报告、已完成变更的中间产物一律归 `openspec/changes/archive/`
- **理由**: docs/ 是"新成员/新会话读取项目理解"的入口，混入历史记录会污染参考价值（`phase1-verification-report.md` 与归档 `2026-07-27-phase1-stability-verification` 内容重复即为实例）
- **备选方案**: 保留报告但标注"历史归档"状态头 — 否决，报告结论已沉淀在 OpenSpec 归档 + specs/ 主目录（`phase1-e2e-verification/spec.md`），保留只会增加双重维护

### Decision 2: 规划文档合并 + 状态标记

- **选择**: 新建 `docs/planning/` 目录，`vision-roadmap-draft.md` 的愿景章节（产品定位、四大战略方向、模块清单）并入 `execution-plan.md` 开头，删除草案文件；规划文档头部统一状态标记格式
- **理由**: 两文档内容高度重叠（目录结构、模块清单各写两遍），且 `execution-plan.md:4` 已引用"关联文档: vision-roadmap-draft.md"，合并后消除重复维护。状态标记让过时一眼可辨（呼应 feedback-process 中"多次出现文档未同步"的痛点）
- **备选方案**: 保留两文件分开维护 — 否决，重复内容必然漂移（已发生：计划模块清单 vs 实际实现）

**状态标记格式**（规划文档头部）:
```markdown
> **状态**: 📋 规划中（Phase 2 未启动） | ✅ Phase 0-1 已完成
> **版本说明**: v4.0/v4.5/v5.0 为内部规划代号，与实际契约版本号（v3.x）独立演进
```

### Decision 3: 版本号双轨 — 内部代号方案

- **选择**: 规划文档中的 v4.0/v4.5/v5.0 明确标注为"内部规划代号"，与实际契约版本号（specs/openapi.yaml ↔ pom.xml ↔ package.json 三处同步的 v3.x）解耦
- **理由**: 规划语义（Phase 进度）与契约语义（发布版本）本就不同维度；强制统一会导致契约版本随规划跳变，或规划数字失真。代号方案保留规划连续性（Phase 2 代号 v5.0 可继续用），且消除"两个官方版本"歧义
- **备选方案**: 规划文档直接对齐实际版本（v3.3.0 = Phase 1 完成，Phase 2 目标 v3.4.0）— 否决，用户已选择代号方案；契约版本号三处同步机制是 CI 检查项，不宜与规划耦合

### Decision 4: CLAUDE.md 精简 — 只砍查表型，保留铁律

- **选择**: 从 225 行精简至 ~160 行，手法如下：

| 段落 | 当前 | 动作 |
|------|------|------|
| 项目概述 + OpenSpec 流程 | 20 | 命令表压缩（保留全部 13 个命令，压缩注释） |
| 关键路径 | 4 | **删除**（路径结构在 openspec/ 目录可见） |
| 常用命令 | 47 | 删"首次设置"（移入 README 引用）；shared 子路径说明压缩为 2 行；后端/前端命令表合并 |
| 提交前验证 | 16 | 压缩为单一代码块 + 五层门禁一行 |
| 文档检查 | 9 | 保留 + 追加"小改动兜底"句 |
| 关键文档 | 9 | 压缩为表格 |
| 契约驱动 API 管道 | 24 | 保留 3 条关键约定，流程细节删除（config.yaml context 已有） |
| 架构 | 66 | 前端目录树压缩；状态管理/模块通信/持久层指针化 → docs/architecture.md |
| 关键约定 | 27 | 全部保留（unwrap、authInterceptor、认证隔离、版本同步为高频约束） |
| 配置表 + 本地环境 | 18 | 保留配置文件速查表；"本地环境"段压缩为 2 行（MySQL 服务名/账号 → 开发环境备忘） |
| 当前版本声明 | 3 | 保留 |

- **理由**: CLAUDE.md 每次会话自动加载（~3.3k tokens），查表型信息（命令、路径）与铁律（OpenSpec 流程、unwrap、版本同步）竞争注意力；官方指南建议 100-200 行
- **备选方案**: 不精简 — 否决，225 行已超建议上限；全部外移到 docs/ — 否决，铁律必须常驻会话上下文，外移即失效

### Decision 5: memory/ 与 frontend/README.md 删除依据

- **选择**: 整体删除 `memory/` 目录与 `frontend/README.md`
- **理由**: 
  - `memory/feedback-process.md` 内容已在 config.yaml rules.tasks + tasks 模板 §8 + CLAUDE.md 文档检查三处覆盖；项目 memory/ **不被会话自动加载**（自动加载仅 CLAUDE.md + 用户级 auto-memory），约束力为零；其中"同步到 auto-memory"约定从未被执行（auto-memory 仅有 openspec-strict-flow）
  - `memory/v1.1-improvements.md` 为 v1.1 历史记录，已被 CHANGELOG + git 覆盖
  - `frontend/README.md` 目录结构描述已废弃（旧 src/hooks/ 等），内容与根 README + CLAUDE.md 重复
  - grep 确认全仓库无任何文件引用 `memory/` 路径
- **备选方案**: 保留 memory/ 作为草稿区 — 否决，无引用 + 无自动加载 = 无价值；feedback 的兜底价值通过 CLAUDE.md"小改动兜底"句实现

## DDD Layer Design

### 领域层 (domain/)
无影响。

### 基础设施层 (infrastructure/)
无影响。

### 应用层 (application/)
无影响。

### API 层 (api/)
无影响。

### 前端 (frontend/src/)
无影响（删除 `frontend/README.md` 仅移除工作区说明文件，不影响 src/ 源码）。

## API Design

无变更。`specs/openapi.yaml` 保持 v3.3.0 不变。

## Database Design

无变更。无新增 Flyway 迁移。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| CLAUDE.md 精简丢失关键约束 | 逐段核对清单（unwrap/authInterceptor/版本同步/文档检查/OpenSpec 流程五条铁律必留），apply 后人工 review diff |
| README.md 文档表引用失效 | tasks 中显式包含 README.md 索引表更新 |
| 规划文档合并丢失历史信息 | 合并时保留全部章节（愿景并入 execution-plan 开头），仅调整位置与状态标记 |
| 删除文件被意外引用 | tasks 首步执行 grep 验证（memory/ 已确认无引用；frontend/README.md 检查 README/CI/脚本） |

## Migration Plan

纯文档变更，无部署步骤。git 层面：
1. 删除文件 + 迁移报告 + 合并规划文档 + 精简 CLAUDE.md + 更新 README 索引，一次提交
2. 提交信息: `docs: 文档组织清理 — 归档验收报告、合并规划文档、精简 CLAUDE.md`

## Open Questions

无。版本号方案（内部代号）已与用户确认。
