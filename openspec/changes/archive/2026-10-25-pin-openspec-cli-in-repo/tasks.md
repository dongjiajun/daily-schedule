# Tasks: pin-openspec-cli-in-repo

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  工具链/CI 类变更：无源码改动，全量验证由 OpenSpec 门禁 + docs 门禁等效替代。
-->

## 1. 实施
- [x] 1.1 根 `package.json` 增加 devDependency `@fission-ai/openspec`（精确 `1.15.0`），执行 `pnpm install` 更新 `pnpm-lock.yaml` 并安装仓库内 CLI —— ✅ `package.json` 锁定 `1.15.0`，lockfile 已更新，`node_modules/.bin/openspec` 可用
- [x] 1.2 `scripts/openspec-check.mjs`：新增仓库内 CLI 解析（优先 `node_modules/@fission-ai/openspec` bin，经 `process.execPath` 启动；缺失回退全局 `openspec`），未安装依赖时给出 `pnpm install` 指引 —— ✅ 本机实测输出"CLI 来源（仓库 node_modules 锁定版本）"
- [x] 1.3 `scripts/openspec-check.mjs`：第 4 检改为版本单源校验（安装版本 = `package.json` 锁定版本 = 文档层声明），更新头部注释、失败消息与 `--self-test` 用例 —— ✅ self-test 通过（新增 `parsePinnedVersion` 正/负例）
- [x] 1.4 `.github/workflows/ci.yml`：`openspec-validation` job 改为 pnpm setup + Node22（pnpm 缓存）+ `pnpm install --frozen-lockfile` + `pnpm run openspec:check`，删除 `npm install -g @fission-ai/openspec@1.15.0` 钉版行 —— ✅ 与 frontend job 安装方式一致
- [x] 1.5 `CLAUDE.md`：CLI 版本口径改为"根 `package.json` 单源"；补充升级 SOP；机制层生成命令改为 `pnpm exec openspec init --tools dsh`；CI 门禁条目同步 —— ✅ 含"提交前验证"分节的"CLI 版本=声明"旧措辞一并改为"CLI 版本单源校验"
- [x] 1.6 `README.md` 首次设置说明核对 —— ✅ 快速开始仅要求 `pnpm install`（现已含仓库锁定 CLI），无全局 OpenSpec 安装描述，现有描述已核对仍准确，无需改动
- [x] 1.7 运行 `node scripts/openspec-check.mjs --self-test` — ✅ 检测器自检通过
- [x] 1.8 运行 `pnpm run openspec:check`（不依赖全局 CLI）— ✅ 七项检查全部通过

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及组件/目录（现有描述已核对仍准确）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型（现有描述已核对仍准确）
- [x] 2.3 `docs/api/overview.md` — 未触及端点/契约（现有描述已核对仍准确）
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — CLAUDE.md 已在 1.5 更新；`docs/architecture.md` 未涉及 OpenSpec CLI 安装描述（现有描述已核对仍准确）
- [x] 2.5 `README.md` — 已在 1.6 核对（现有描述已核对仍准确）
- [x] 2.6 运行 `node scripts/docs-check.mjs` — ✅ 通过；`./scripts/sync-version.sh --check` 本地无 WSL 不可执行，由 CI version-check job 等效验证（归档条目注明）
- [x] 2.7 运行 `pnpm run openspec:check` — ✅ 通过（1.8 已覆盖，归档前复跑）

## 3. 全量验证
- [x] 3.1 `openspec validate --all --strict --no-interactive` — ✅ 70/70 通过（含本变更）
- [x] 3.2 `openspec validate --archived --no-interactive` — ✅ 70/70 通过
- [x] 3.3 无源码变更，`mvn test` / `pnpm run verify` / E2E 跳过（等效依据：仅工具链/CI/文档，门禁由 openspec-validation + version-check job 覆盖；`pnpm install --frozen-lockfile` 已验证 lockfile 同步）

## 4. 归档
- [x] 4.1 归档留痕（delta 同步结论 + 归档后复跑 validate/docs-check/openspec-check/validate --archived；零代码变更 → 全量验证组套件 + `validate --archived` 等效替代 `/opsx:verify`）
