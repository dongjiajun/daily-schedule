# Tasks: dsh-skills-only

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  本变更仅收敛机制层/文档与约定（零代码变更）。
-->

## 1. 实施

- [x] 1.1 删除 `.dsh/commands/opsx/*.md`（12 个文件）及空的 `.dsh/commands/` 目录；确认 `.dsh/skills/`、`.claude/` 机制层产物不受影响 —— ✅ `.dsh` 仅剩 `skills/`（12 个 openspec skill），`.claude` 未动
- [x] 1.2 运行 `openspec update --dry-run` 复核机制层仍幂等（官方管理的 skills/commands 无变更）—— ✅ "No changes: skills and commands are up to date."
- [x] 1.3 `CLAUDE.md` 机制层描述更新：删除 `.dsh/commands/opsx` 人工镜像表述，明确机制层 = `.claude/commands/opsx/` + `.claude/skills/` + `.dsh/skills/`（dsh 官方 skills-only）
- [x] 1.4 `docs/architecture.md` 指令体系分层描述同步（机制层产物与 dsh skills-only 说明）
- [x] 1.5 delta spec（`openspec-conventions`「指令体系分层与收敛」）随归档同步到主 spec

## 2. 文档同步

- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论"现有描述已核对仍准确"
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论"现有描述已核对仍准确"
- [x] 2.3 `docs/api/overview.md` — 未触及端点/契约 → 核对结论"现有描述已核对仍准确"
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — 本变更已更新（1.3/1.4）
- [x] 2.5 `README.md` — 无 `.dsh` 相关内容 → 核对结论"现有描述已核对仍准确"
- [x] 2.6 运行 `node scripts/docs-check.mjs` — 通过（`sync-version.sh` 依赖 bash/WSL，本机未装 WSL；以三处版本人工核对等价，CI ubuntu 执行）
- [x] 2.7 运行 `pnpm run openspec:check` — 七检全绿

## 3. 全量验证

- [x] 3.1 `openspec validate --all --strict --no-interactive` → 全绿（含本活动变更，70/70）
- [x] 3.2 `openspec validate --archived --no-interactive` → 全绿（68/68）
- [x] 3.3 `openspec update --dry-run` → No changes（机制层幂等）；`.dsh/skills` 与 `.claude` 的 `generatedBy` 仍为 1.15.0
- [x] 3.4 E2E / 前后端测试 — 零代码变更，跳过（无 UI/用户流程影响）

## 4. 归档

- [x] 4.1 归档留痕（delta 同步结论 + 归档后复跑 validate/docs-check/openspec-check；零代码变更 → 全量验证组套件 + `validate --archived` 等效替代 `/opsx:verify`）
