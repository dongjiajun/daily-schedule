# Proposal: pin-openspec-cli-in-repo

## Why

OpenSpec CLI 版本目前靠"全局安装 + `ci.yml` 硬编码 + `CLAUDE.md` 声明"三处手工同步：新环境要求先 `npm install -g`，CI 与本机安装方式不一致，升级时漏改任一处都会造成版本漂移（`openspec-check` 第 4 检只能事后告警）。项目即将推进 AGENTS.md 迁移、schema 三档化等多项工作流改造，先把 CLI 版本收敛为仓库内单源，工具链才可复现，后续变更无需重复处理版本同步。

## What Changes

- 根 `package.json` 增加 `devDependencies`：`@fission-ai/openspec: "1.15.0"`（精确版本，唯一版本源），`pnpm install` 更新 `pnpm-lock.yaml`
- `scripts/openspec-check.mjs`：
  - 新增仓库内 CLI 解析——优先 `node_modules/@fission-ai/openspec` 的 bin（经 `process.execPath` 启动），缺失时回退全局 `openspec`；本地未安装依赖时失败消息指向 `pnpm install`
  - 第 4 检版本守卫改为单源校验：实际安装版本 = `package.json` 锁定版本 = 文档层声明版本；失败提示改为"改 `package.json` + `pnpm install`"
  - 更新头部注释、`--self-test` 覆盖新解析器
- `.github/workflows/ci.yml`：`openspec-validation` job 改为 `pnpm/action-setup` + `actions/setup-node`（pnpm 缓存）+ `pnpm install --frozen-lockfile` + `pnpm run openspec:check`；删除 `npm install -g @fission-ai/openspec@1.15.0` 钉版行
- `CLAUDE.md`：口径更新为"版本单源 = 根 `package.json`"；补充升级 SOP（改版本 → `pnpm install` → `pnpm exec openspec update` → `pnpm run openspec:check` → 提交）；机制层生成命令改为 `pnpm exec openspec init --tools dsh`
- 非 **BREAKING**（工作流/工具链，无 API 契约、无运行时代码变化）

## Capabilities

### New Capabilities

- 无（纯工具链变更，不新增能力）

### Modified Capabilities

- `openspec-conventions`: CI 门禁要求由"npm 全局安装钉版本 CLI + 三处声明同步"改为"仓库 `package.json` 精确锁定为唯一版本源，CI 以 pnpm 安装执行，版本守卫校验安装版本 = `package.json` = 文档声明"，并补充本地优先使用仓库内 CLI 的场景

## API Contract Impact

无影响——不修改 `specs/openapi.yaml`，不涉及任何端点/字段。

## DDD Layer Impact

无——不触碰后端 API/应用/领域/基础设施任一层。

## Database Impact

无需 Flyway 迁移，不涉及表/列。

## Impact

- 文件：`package.json`、`pnpm-lock.yaml`、`scripts/openspec-check.mjs`、`.github/workflows/ci.yml`、`CLAUDE.md`（`README.md` 待核对）
- CI：`openspec-validation` job 增加 pnpm 安装步骤（约 +20~40s，命中缓存后更短），换来安装方式与本机一致
- 本地：新环境只需 `pnpm install`；升级 OpenSpec 只改 `package.json` 一处版本 + `pnpm install`
- 风险：`@fission-ai/openspec` 进入 devDependencies 后由 pnpm 管理（仓库 node_modules 体积略增）；全局安装仍可作为兜底，不再是主路径
- 文档：`CLAUDE.md` 的 CLI 版本声明与 CI 门禁条目同步更新；不涉及 docs/ 业务文档
