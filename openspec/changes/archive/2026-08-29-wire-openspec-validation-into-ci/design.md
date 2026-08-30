# Design: wire-openspec-validation-into-ci

## Context
OpenSpec 1.11.0 已与项目约定对齐（template/schema/config/CLAUDE.md），`openspec validate --specs --strict` 本地全绿（67/67），但一致性无 CI 门禁：主 spec 漂移、活动变更 artifacts 不完整、delta 头误入主 spec 均可能合入。本变更把门禁接入 CI（`openspec` 为 npm 全局包 `@fission-ai/openspec@1.11.0`，repo 无该依赖）。

约束：
- CI 为 GitHub Actions（ubuntu-latest + Node 22，`version-check` job 已跑 `scripts/sync-version.sh --check` + `node scripts/docs-check.mjs`）
- 本地开发为 Windows + pwsh，脚本须跨平台（沿用 `docs-check.mjs` 的 Node ESM 形态）
- `openspec validate --all` 范围 = 67 主 specs + 活动变更（不含 archives）；`--archived` 含 49 个归档变更，其中 10 个历史归档 tasks 未全勾（先于 tasks 完整性纪律），本地基线红

## Goals / Non-Goals

**Goals:**
- CI 新增 `openspec-validation` job，钉版本安装 `@fission-ai/openspec@1.11.0` 并运行 `scripts/openspec-check.mjs`
- `scripts/openspec-check.mjs`：`validate --all --strict --no-interactive` + `doctor` + 主 spec delta 头守卫 + CLI 版本守卫，任一失败非零退出，跨平台
- 根 `package.json` 提供 `openspec:check`，与 `docs:check` 并列，本地可复跑
- `CLAUDE.md` 声明门禁与检查命令；`openspec/specs/openspec-conventions/spec.md` 同步新增 Requirement

**Non-Goals:**
- 不修复 10 个历史归档变更的未全勾 tasks（另开 `backfill-archive-task-completion`）
- 本次不纳入 `openspec validate --archived` 门禁（前置条件修复后再追加）
- 不将 `@fission-ai/openspec` 加入仓库依赖树/pnpm lockfile
- 不改 `specs/openapi.yaml` / `pom.xml` / `package.json` 版本，无任何后端、前端、小程序代码变更

## Decisions

### Decision 1: 检查脚本用 Node ESM（.mjs）而非 bash
- **选择**: `scripts/openspec-check.mjs`，用 `execFileSync` 顺序执行子检查，主进程聚合退出码
- **理由**: 与 `scripts/docs-check.mjs` 同构（project 已确立 Node 脚本模式）；跨平台——开发者本地 Windows/pwsh 可直接 `pnpm run openspec:check` 复跑；CI 已有 Node 22，零新增运行时
- **备选方案**: bash 脚本（`sync-version.sh` 模式）——CI 可用但 Windows 本地无直接运行能力，否决；CI 内联 shell 命令——无法本地复跑、易漂移，否决

### Decision 2: 独立 `openspec-validation` job，而非并入 version-check
- **选择**: ci.yml 新增独立 job（checkout → setup-node → `npm i -g @fission-ai/openspec@1.11.0` → `node scripts/openspec-check.mjs`），无 needs 依赖
- **理由**: 与 job-per-gate 结构一致（version-check/backend/frontend/e2e 各自独立）；openspec 安装失败与检查失败同 job 内可见，失败归因清晰；version-check 保持"版本同步 + 文档一致性"单一职责
- **备选方案**: 并入 version-check——省一个 runner 但 job 职责混杂、输出噪音，否决；并入 frontend job——需要 pnpm 环境且与全局 npm 安装混用，否决

### Decision 3: CI 用 npm 全局钉版安装，不用 npx 或 devDependency
- **选择**: `npm install -g @fission-ai/openspec@1.11.0`（版本硬编码 + 注释提示与 CLAUDE.md 同步）；`openspec-check.mjs` 内 `checkCliVersion` 用 `openspec --version` 反查并与 CLAUDE.md 声明的 `OpenSpec CLI <version>` 比对
- **理由**: 版本钉定 + 声明一致是双保险——升级 OpenSpec 必须同时改 ci.yml 安装行与 CLAUDE.md，否则 CI 红；全局安装对 npm 路径无歧义（ubuntu runner `/usr/local/bin` 在 PATH）
- **备选方案**: `npx @fission-ai/openspec@1.11.0 <cmd>`——每条命令长前缀、错误定位差，否决；devDependency——污染 pnpm lockfile 与前端依赖图、本地全局 CLI 与仓库版本会分叉，否决

### Decision 4: 门禁取 `validate --all --strict`（specs + 活动变更），不取 `--archived`
- **选择**: 脚本执行 `openspec validate --all --strict --no-interactive`；`--archived` 留作后续追加
- **理由**: `--all` 是"当前可合并状态"的完整门面——活动变更必须 artifacts 完整（与本流程 ff 一次性产全 4 artifacts 契合）；`--archived` 含 10 个遗留红项，现在硬接会让 CI 永久红直至修复，属历史债务，非本变更范围
- **备选方案**: 仅 `validate --specs --strict`——活动变更漏检，否决；`--all` + `--archived` 全上——前置 10 个红项，否决（作为后续 backfill 的前提）

### Decision 5: delta 头守卫用文件扫描 + 正则
- **选择**: `openspec-check.mjs` 递归扫描 `openspec/specs/**/spec.md`，命中 `/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements$/` 或 `/^### (Modified|Removed|Renamed) Requirement:/` 即输出 `路径:行号` 并失败
- **理由**: 零依赖、确定性；主 spec 的合法格式（`## Requirements` / `### Requirement:` / `#### Scenario:`）与 delta 标记（`## ADDED/MODIFIED/… Requirements` / `### Modified/… Requirement`）泾渭分明，无需引入 YAML/解析库
- **备选方案**: 依赖 openspec CLI 内置校验——官方无此检查，且放行路径（changes 内的 delta 合法）与主 spec 守卫语义不同，否决

## DDD Layer Design
无。本变更为 CI/元工作流变更，后端零代码。

### 领域层 (domain/)
无——不触碰实体、DomainService、Repository。

### 基础设施层 (infrastructure/)
无——无 persistence/security/scheduled/notification 改动，无 Flyway 迁移。

### 应用层 (application/)
无——无 ApplicationService 改动。

### API 层 (api/)
无——无 Controller/Assembler/异常映射改动。

### 前端 (frontend/src/)
无——仅根 `package.json` 脚本与仓库级脚本变化。

## API Design
无。`specs/openapi.yaml` 零变更，无 SDK 再生成。

## Database Design
无。无新表/改表，无 Flyway 迁移。

## Risks / Trade-offs
- [CI 全局 npm 安装每次下载（无缓存），job 增耗时 ~10-20s] → 门禁价值高于耗时；必要时后续加 `actions/setup-node` 缓存或 npm cache action
- [`validate --all` 对活动变更严格，中途推分支即红] → 有意为之（spec-driven 流程下变更应 complete 后合并）；若后续体验差，可按需降级为仅 `--specs`
- [10 个历史归档 tasks 未全勾，`--archived` 未纳入] → 已定位为 Non-Goal；`backfill-archive-task-completion` 修复后追加一行即可纳入
- [CLI 升级前后行为差异] → 钉版本 + 版本守卫双保险；升级时须同步 ci.yml 安装行、CLAUDE.md 声明、`.dsh` skills/commands

## Migration Plan
1. 本变更提交后，CI 新增 `openspec-validation` job 随首个 push 生效
2. 本地复跑：`pnpm run openspec:check`（需全局 `openspec` CLI；未安装时脚本给出明确报错）
3. 回滚：revert ci.yml 中的 job（脚本与 package.json 保留无害）；无数据迁移

## Open Questions
- 是否在 `backfill-archive-task-completion` 完成后把 `openspec validate --archived` 纳入门禁？——倾向纳入（已在设计中预留）
- CI 安装是否加 npm cache 加速？——低优先，视 job 实际耗时决定
