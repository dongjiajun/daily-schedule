# Design: spec-driven-custom-lite

## Context
本会话连续 5 个纯工具链/流程变更全量过 `spec-driven-custom`（proposal + specs + design + tasks 1-9 组），其中 design 多为"确认无架构决策"、tasks 1-7 组纯 N/A——负担大于信息量。官方生态已确认"轻量子集"为推荐模式（openspec-schemas 集合：默认 `spec-driven` 够用，其余为 lighter subsets 或专用变体；`minimalist` = specs → tasks 供小变更）。本项目定制 `spec-driven-custom-lite`：保留 proposal、砍 design，tasks 精简为 4 组。

约束：
- `openspec schema init`/`fork`/`validate`/`which` 为官方命令（schema 扩展点）；`openspec/config.yaml` 的 `schema:` 控制默认（现为 custom）
- `openspec/schemas/spec-driven-custom-lite/` 下 schema.yaml + templates/ 即完整注册；模板按目录解析（各自独立文件）

## Goals / Non-Goals

**Goals:**
- 新增 schema `spec-driven-custom-lite`：proposal → specs → tasks（无 design），`apply.requires=[tasks]`
- lite `tasks.md` 模板精简为 4 组（1 实施 / 2 文档同步 / 3 全量验证 / 4 归档），保留项目验证纪律（docs-check / openspec-check / 逐项核对）
- proposal/spec 模板与 custom 单源一致；默认 schema 不变
- 主 spec 记录规则（注册为项目 schema、适用范围、模板同步纪律）

**Non-Goals:**
- 不切换默认 schema（config `schema:` 保持 custom）
- 不修改既有 `spec-driven-custom` 模板（本次仅新增 lite）
- 不引入社区 `minimalist` 式"specs → tasks 无 proposal"（动机/影响面留痕是项目文档纪律的一部分）
- 不改 `/opsx:new` skill 本体（CLI `--schema` 用法在文档层说明）

## Decisions

### Decision 1: 保留 proposal、砍 design
- **选择**: lite 链 = proposal → specs → tasks；design 完全移除（非 optional）
- **理由**: proposal 承载动机/影响面/skip_specs 判定/文档核对入口，与项目"每个变更留痕"纪律耦合；design 仅在小变更中退化为一页"无架构决策"确认——砍掉最直接；社区 `minimalist`（specs → tasks，连 proposal 都砍）过于激进，与本项目文档纪律不兼容
- **备选方案**: 对齐 minimalist（specs → tasks）——动机留痕丢失，否决；design 保留为 optional artifact（仍需判断/生成，减负有限），否决

### Decision 2: tasks 精简为 4 组，验证纪律不缩水
- **选择**: lite tasks 模板：1 实施 / 2 文档同步（保留逐项核对 + docs-check/openspec-check 条目）/ 3 全量验证 / 4 归档
- **理由**: 小变更无 DDD 四层/契约/前端七步可核对，固定组纯 N/A 噪音；"逐项评估"+"自动化验证"是项目硬纪律（docs-sync-guarantee，CI 已接）——保留在文档同步组，不因精简丢失
- **备选方案**: 复用 custom tasks 模板（1-9）——无减负，否决；连文档核对也简化——违反 docs-sync 纪律，否决

### Decision 3: 按变更 opt-in，默认不变
- **选择**: 使用方式 = `openspec new change <name> --schema spec-driven-custom-lite`；`config.yaml schema:` 不动
- **理由**: 轻量是**有条件的优化**（小变更才适用），默认重工作流能可靠覆盖复杂变更；opt-in 让每次选择有意识；社区同样以 `schema:` 一行激活的 schema 多版本并存
- **备选方案**: 默认切 lite——复杂变更可能无 design 留痕，否决

### Decision 4: 模板复制 + 同步纪律（非引用）
- **选择**: lite templates 为独立文件（proposal/spec 复制 custom 当前内容；tasks 为自有精简版）；主 spec 固化"custom 为先、lite 同步"纪律；每次模板变更跑 `schema validate` + 冒烟
- **理由**: schema 模板按各自 templates/ 目录解析，跨目录引用无官方支持；复制 + 纪律 + 验证防漂移，符合项目"规范单源化"原则（权威=schema instruction/模板，此处两 schema 互为镜像并以 custom 为先）
- **备选方案**: 运行时共享——官方不支持，否决；不做纪律——两处漂移，否决

## DDD Layer Design
无。本变更为 OpenSpec 元工作流（schema/模板/文档），后端零代码。

## API Design
无。`specs/openapi.yaml` 零变更。

## Database Design
无。无 Flyway 迁移。

## Risks / Trade-offs
- [lite 与 custom 模板漂移] → 同步纪律（主 spec Requirement）+ `openspec schema validate`（模板结构校验）+ 冒烟核对 status
- [lite 被误用于复杂变更（缺 design 决策留痕）] → 适用范围 Requirement（跨模块/新架构/外部依赖/安全/性能/迁移复杂度 SHALL 用 custom）；评审时依 proposal Capabilities/影响面判定
- [docs-check specs-count 68 与冒烟临时变更交互] → 冒烟在 TEMP 根执行（不落项目 openspec/），不改变计数；项目内计数只随主 spec 目录数变化（本次 67→68）

## Migration Plan
1. 建 schema 目录 + templates → 2. `openspec schema validate` → 3. TEMP 根冒烟（--schema lite → status 3 工件 → 删除）→ 4. 主 spec + docs marker 68 + CLAUDE.md → 5. 全量验证 → 6. 归档（sync 主 spec）；回滚 = 删除 schema 目录与主 spec（无数据迁移，模板为新增不覆盖既有）

## Open Questions
- 无——链形态/默认策略/同步纪律均已定案；`/opsx:new` 的 `--schema` 透传留待 skill 层按需（本次文档层说明）
