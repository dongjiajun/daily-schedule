# Tasks: localize-mechanism-layer

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  本变更仅收敛机制层归属与文档/约定（零代码变更）。
-->

## 1. 实施

- [x] 1.1 `.dsh/` 移出版本控制：`git rm -r --cached .dsh`（本地文件保留）；确认 `git ls-files .dsh` 为空 —— ✅ 0 跟踪 / 41 本地文件保留
- [x] 1.2 删除 `.claude/` 目录（53 个 tracked 文件，路径确认后删除）；确认 `.claude` 不再存在 —— ✅ 已删除，`Test-Path .claude` = False
- [x] 1.3 `.gitignore` 更新：移除 Claude Code 旧条目，新增「AI 工具指令目录（本地生成，不入库）」段：`.dsh/`、`.claude/`
- [x] 1.4 `CLAUDE.md` 机制层描述更新：机制层 = 本地生成的 `.dsh/skills/`（不入库；新环境 `openspec init --tools dsh` 生成）；删除 `.claude` 相关内容
- [x] 1.5 `docs/architecture.md` 指令体系分层描述同步
- [x] 1.6 干净副本验证：`openspec init --tools dsh` 能重建 12 个 skills 且不改 `openspec/config.yaml`；`openspec update --dry-run` 幂等 —— ✅ 沙盒实测（config diff 为空、12 skills、update "No changes"）
- [x] 1.7 delta spec（`openspec-conventions`「指令体系分层与收敛」）随归档同步到主 spec

## 2. 文档同步

- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论"现有描述已核对仍准确"
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论"现有描述已核对仍准确"
- [x] 2.3 `docs/api/overview.md` — 未触及端点/契约 → 核对结论"现有描述已核对仍准确"
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — 本变更已更新（1.4/1.5）
- [x] 2.5 `README.md` — 无 `.claude`/`.dsh` 相关内容 → 核对结论"现有描述已核对仍准确"
- [x] 2.6 运行 `node scripts/docs-check.mjs` — 通过（`sync-version.sh` 依赖 bash/WSL，本机未装 WSL；以三处版本人工核对等价，CI ubuntu 执行）
- [x] 2.7 运行 `pnpm run openspec:check` — 七检全绿

## 3. 全量验证

- [x] 3.1 `openspec validate --all --strict --no-interactive` → 全绿（含本活动变更，70/70）
- [x] 3.2 `openspec validate --archived --no-interactive` → 全绿（69/69）
- [x] 3.3 干净副本模拟 CI：无 `.dsh/`、无 `.claude/` 时 `node scripts/openspec-check.mjs` 与 `openspec validate --all --strict` 仍全绿 —— ✅ 临时干净副本 70/70 + 七检全绿
- [x] 3.4 E2E / 前后端测试 — 零代码变更，跳过（无 UI/用户流程影响）

## 4. 归档

- [x] 4.1 归档留痕（delta 同步结论 + 归档后复跑 validate/docs-check/openspec-check；零代码变更 → 全量验证组套件 + `validate --archived` 等效替代 `/opsx:verify`）
