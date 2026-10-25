# Tasks: adopt-agents-md-and-portable-skills

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  工具链/文档层变更：无源码改动，全量验证由 OpenSpec 门禁 + docs 门禁等效替代。
-->

## 1. 实施
- [x] 1.1 `git mv CLAUDE.md AGENTS.md`，首行说明改为面向通用 AI coding agents（DeepSeek Harness / Codex 等 AGENTS.md 兼容工具）—— ✅ 完成，DSH 会话已实际加载 AGENTS.md（CLAUDE.md 指令自动失效）
- [x] 1.2 全仓引用替换：`CLAUDE.md` → `AGENTS.md`（README / docs/architecture.md / config rules / 两个 schema 的 instruction 与模板 / scripts / ci.yml）；已归档变更保持历史原样 —— ✅ 12 个文件 41 处替换；主 spec 经 delta 更新
- [x] 1.3 机制层迁移：`pnpm exec openspec init --tools agents` 生成 `.agents/skills/`（12 skills + `.openspec-target`）并入库；删除本机 `.dsh/skills/openspec-*`（保留个人技能）；验证 `openspec update --dry-run` 幂等 —— ✅ 12 skills + marker=agents；`update --dry-run --json` 返回 `changes: []`
- [x] 1.4 `.gitignore` 更新：机制层注释、`AGENTS.local.md`/`CLAUDE.local.md`、`docs/diagrams/_preview/`；确认 `.dsh/` 仍被忽略且 `.agents/skills` 不被忽略 —— ✅ `git status` 中 `.agents/` 可见、`.dsh/` 不可见
- [x] 1.5 `scripts/openspec-check.mjs` 新增第 8 检「机制层完整性」（marker=agents、12 skills `generatedBy`=锁定版本、`update --dry-run --json` 无变更、`.dsh` 不被跟踪），同步头部注释、主流程与 `--self-test` 解析器用例 —— ✅ 八检全绿，self-test 通过
- [x] 1.6 主 spec 经 delta 更新：`openspec-conventions`（三层职责 + 八项检查）、`doc-sync-workflow`（文档层命名）、`precommit-verify`（文档层命名）；`doc-sync-workflow`/`precommit-verify`/`service-caching` 的 Purpose 直接编辑为 AGENTS.md 引用 —— ✅ `openspec validate <change> --strict` 通过
- [x] 1.7 运行 `node scripts/openspec-check.mjs --self-test` 与 `pnpm run openspec:check` — ✅ 自检与八项检查全部通过

## 2. 文档同步
- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及组件/目录（现有描述已核对仍准确）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型（现有描述已核对仍准确）
- [x] 2.3 `docs/api/overview.md` — 未触及端点/契约（现有描述已核对仍准确）
- [x] 2.4 `docs/architecture.md` + `AGENTS.md` — 均已在 1.1/1.2 更新（文档层引用改为 AGENTS.md）
- [x] 2.5 `README.md` — 已在 1.2 更新文档层引用
- [x] 2.6 运行 `node scripts/docs-check.mjs` — ✅ 通过；`./scripts/sync-version.sh --check` 本地无 WSL 不可执行，由 CI version-check job 等效验证（归档条目注明）
- [x] 2.7 运行 `pnpm run openspec:check` — ✅ 八项检查全部通过（归档前复跑）

## 3. 全量验证
- [x] 3.1 `openspec validate --all --strict --no-interactive` — ✅ 70/70 通过（含本变更）
- [x] 3.2 `openspec validate --archived --no-interactive` — ✅ 71/71 通过
- [x] 3.3 无源码变更，`mvn test` / `pnpm run verify` / E2E 跳过（等效依据：仅工具链/文档层，门禁由 openspec-validation + version-check job 覆盖）

## 4. 归档
- [x] 4.1 归档并复跑 `validate --all --strict` / `docs-check` / `openspec:check` / `validate --archived`，归档条目注明等效验证依据
