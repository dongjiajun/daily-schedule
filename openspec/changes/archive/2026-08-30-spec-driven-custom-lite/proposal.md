# Proposal: spec-driven-custom-lite

## Why
小规模变更（工具链/文档/单点修复）走 `spec-driven-custom` 全套（proposal → specs → design → tasks，tasks 含 DDD 1-9 固定组）负担偏重——本会话连续 5 个纯工具链变更都全量过了 4 artifacts。官方生态已确认"轻量子集"为推荐模式（[openspec-schemas](https://github.com/intent-driven-dev/openspec-schemas) 的 `minimalist` = specs → tasks 供小变更），本项目定制一档：`spec-driven-custom-lite`（proposal → specs → tasks，无 design 工件），小规模变更按需选轻量路径，不牺牲留痕与验证纪律。

## What Changes
- 新建 `openspec/schemas/spec-driven-custom-lite/`：
  - `schema.yaml` — artifacts：proposal → specs → tasks（**无 design**）；`tasks.requires=[proposal,specs]`；`apply.requires=[tasks]`；tasks 精简指令（1 实施 / 2 文档同步 / 3 全量验证 / 4 归档）
  - `templates/proposal.md` + `templates/spec.md` — 与 `spec-driven-custom` 同内容（单源复制，修改须两处同步）
  - `templates/tasks.md` — lite 精简版（4 组，保留"逐项核对"与 docs-check/openspec-check 验证条目）
- 新建主 spec `openspec/specs/spec-driven-custom-lite/spec.md`（新能力，同步时种子）
- `docs/architecture.md` — `specs-count` marker **67→68**（新主 spec 目录）
- `CLAUDE.md` — 工作流小节补 lite 用法：`openspec new change <name> --schema spec-driven-custom-lite`；选用原则（小规模/单模块/无架构决策；工具链无行为变化仍 skip_specs；**默认仍是 spec-driven-custom**）
- 不在本 change：`openspec/config.yaml` 的 `schema:` 不改（默认保持 custom）；不修改 `spec-driven-custom` 既有模板

## Capabilities

### New Capabilities
- `spec-driven-custom-lite`: 项目轻量工作流——小规模变更走 proposal → specs → tasks（无 design 工件）的 artifact 链；与 `spec-driven-custom` 模板单源化；适用范围与默认 schema 约定

### Modified Capabilities
（无）

## API Contract Impact
无。`specs/openapi.yaml` 零变更。

## DDD Layer Impact
无。后端零变更（仅 OpenSpec 元工作流的 schema/模板/文档）。

## Database Impact
无需。无 Flyway 迁移。

## Impact
- `openspec/schemas/spec-driven-custom-lite/schema.yaml` + `templates/{proposal,spec,tasks}.md`（新增）
- `openspec/specs/spec-driven-custom-lite/spec.md`（新增主 spec，specs-count 67→68）
- `docs/architecture.md`（marker 68）、`CLAUDE.md`（lite 用法与选用原则）
- 验证：`openspec schema validate spec-driven-custom-lite` + TEMP 根冒烟（`--schema lite` → status 3 artifacts 无 design）+ `validate --specs --strict` 68/68 + docs-check + 前后端回归（零代码变更）
