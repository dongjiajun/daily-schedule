# Tasks: upgrade-openspec-cli

<!--
  LITE 工作流（spec-driven-custom-lite）：1-4 固定分组，无 DDD 1-9 固定组。
  本次为纯工具链/元数据升级 + 主 spec 格式修复（零代码变更），1-4 组按工具链变更编排。
-->

## 1. 实施

- [x] 1.1 升级前基线留痕：`openspec --version`（1.11.0）、`validate --all --strict`（69/69）、`validate --archived`（67/67）、`.claude`/`.dsh` 快照备份，记录 `generatedBy: "1.11.0"` —— ✅ 基线复跑全绿，快照存 `%TEMP%\openspec-upgrade\snapshot-claude-dsh`
- [x] 1.2 官方升级 CLI：`npm install -g @fission-ai/openspec@1.15.0`；先 `openspec update --dry-run` 复核待变更文件清单，再 `openspec update`（必要时 `--force`）—— ✅ 1.11.0 → 1.15.0；dry-run 报告 36 文件待变更，实际 `openspec update` 更新 claude + dsh 两个工具（各 1.11.0 → 1.15.0）
- [x] 1.3 校验机制层重生成结果：`.claude/commands/opsx/*`（12）+ `.claude/skills/openspec-*/SKILL.md`（12）+ `.dsh/skills/openspec-*/SKILL.md`（12）内容刷新，`generatedBy: "1.15.0"`；非 OpenSpec 技能（vitest/webapp-testing/test-driven-development）保持不变 —— ✅ 36 文件全部刷新为 `generatedBy: "1.15.0"`，15 个 skills 目录（12 openspec + 3 项目技能）结构不变
- [x] 1.4 `.dsh/commands/opsx/*` 人工镜像同步为 1.15.0 内容（官方 dsh 适配器仅生成 skills，不生成 commands；保持现有 `.claude`/`.dsh` 双份一致策略）—— ✅ 12 文件镜像后与 `.claude/commands/opsx` 逐字节一致
- [x] 1.5 主 spec 格式修复：10 个 spec 的 15 条超长需求正文压至 ≤500 字符（语义不变，细节移入 scenario），1.15.0 `validate --specs --strict` 69/69 通过 —— ✅ +134/−93，需求标题/场景名无删减、字符数净增，`validate --specs --strict` 69 passed / 0 failed
- [x] 1.6 `.github/workflows/ci.yml` 的 openspec-validation 钉版安装行 1.11.0 → 1.15.0（含注释同步）
- [x] 1.7 `CLAUDE.md`：OpenSpec CLI 版本声明 1.11.0 → 1.15.0；机制层说明更新（`.claude` skills/commands 官方生成、`.dsh/skills` 官方 dsh 集成、`.dsh/commands` 人工镜像）
- [x] 1.8 `scripts/openspec-check.mjs`：self-test 中的版本字面量 `1.11.0` → `1.15.0`（解析器正例，仅测试夹具）
- [x] 1.9 指令层对齐：两个自定义 schema 的 instruction 中「官方 1.11.0 规范」→「官方 1.15.0 规范」，并在 specs.instruction 补「需求正文 ≤500 字符」篇幅纪律（细节移入 scenario / 拆分需求）
- [x] 1.10 `openspec-conventions` 主 spec：Purpose 与场景示例中的版本引用 1.11.0 → 1.15.0（直接编辑主 spec，无需求级行为变化）
- [x] 1.11 运行 `openspec validate --all --strict --no-interactive`：主 spec 全绿 + 活动变更（skip_specs）INFO 接受 —— ✅ Totals: 70 passed, 0 failed

## 2. 文档同步

- [x] 2.1 `docs/frontend/component-catalog.md` — 未触及组件/目录 → 核对结论"现有描述已核对仍准确"（文件无 OpenSpec/CLI 版本引用）
- [x] 2.2 `docs/database/schema.md` + `docs/uml/README.md` — 未触及表/字段/领域模型 → 核对结论"现有描述已核对仍准确"（零数据库变更）
- [x] 2.3 `docs/api/overview.md` — 未触及端点/契约 → 核对结论"现有描述已核对仍准确"（`specs/openapi.yaml` 零变更）
- [x] 2.4 `docs/architecture.md` + `CLAUDE.md` — OpenSpec 门禁/机制层分居描述更新（CLI 版本、dsh 官方集成、新增 strict 篇幅规则）
- [x] 2.5 `README.md` — CI 门禁描述同步（补「需求正文 ≤500 字符 strict 规则」）
- [x] 2.6 运行 `node scripts/docs-check.mjs` + `./scripts/sync-version.sh --check` — 文档一致性检查通过 —— ✅ docs-check 全绿；`sync-version.sh` 依赖 bash/WSL（本机未装 WSL，脚本未改动），以等价人工核对代替：`specs/openapi.yaml` 3.5.1 = `frontend/package.json` 3.5.1 = `backend/pom.xml` 项目版本 3.5.1-SNAPSHOT（三处一致），CI ubuntu 上仍由该脚本把关
- [x] 2.7 运行 `pnpm run openspec:check` — 七类检查全绿（含第 4 检 CLI 版本守卫、第 7 检 CLAUDE.md 序列守卫）—— ✅ 七检全绿（validate --all --strict / doctor / delta 头守卫 / CLI 版本守卫 1.15.0=1.15.0 / validate --archived 67/67 / test-plan / CLAUDE.md 序列）

## 3. 全量验证

- [x] 3.1 `openspec validate --all --strict --no-interactive`（1.15.0）→ 全绿（70/70）
- [x] 3.2 `openspec validate --archived --no-interactive`（1.15.0）→ 67/67 通过
- [x] 3.3 `openspec doctor` + `openspec schema validate spec-driven-custom` + `spec-driven-custom-lite` → 均通过 —— ✅ doctor root ok；两 schema 均 "is valid"
- [x] 3.4 指令层冒烟：`openspec instructions <artifact> --change upgrade-openspec-cli`（proposal/tasks）与 `openspec templates --schema spec-driven-custom` 输出正常 —— ✅ instructions 输出含 schema instruction + config context/rules；templates 5 工件路径全部解析
- [x] 3.5 `node scripts/openspec-check.mjs --self-test` → 检测器自检通过
- [x] 3.6 E2E / 前后端测试 — 零代码变更，跳过（无 UI/用户流程影响）

## 4. 归档

- [x] 4.1 归档留痕（`openspec archive upgrade-openspec-cli`）：归档后复跑 `validate --all --strict`、`validate --archived`、`openspec:check`、`docs:check`，记录等效验证依据（零代码变更 → 全量验证组套件 + `validate --archived` 等效替代 `/opsx:verify`）—— ✅ 归档后复跑全绿（等效依据：零代码变更，全量验证组套件 + validate --archived 全绿）

<!-- 删除本模板注释示例行，逐项替换为实际内容 -->
