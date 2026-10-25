# OpenSpec 工作流约定（openspec-conventions）

## MODIFIED Requirements

### Requirement: 指令体系分层与收敛
项目 OpenSpec 指令体系 SHALL 分三层管理，维护职责不得混淆：机制层（`.dsh/skills/`）由 CLI 在本地生成、禁止手改且不入版本库，项目 SHALL NOT 提交 `.dsh/`、`.claude/` 或维护 `.dsh/commands/`；指令层（`openspec instructions`）是工件撰写依据的唯一动态来源；文档层（`CLAUDE.md`）仅承载 CLI 无法表达的约定。

#### Scenario: 三层职责边界

- **WHEN** 维护 OpenSpec 指令体系
- **THEN** 机制层——`.dsh/skills/` 由 CLI 在本地生成（`openspec init --tools dsh` 或 `openspec update`，`generatedBy` 对应 CLI 版本），SHALL NOT 提交入库（`.gitignore` 排除 `.dsh/` 与 `.claude/`），SHALL NOT 被手改；项目 SHALL NOT 维护 `.claude/` 与 `.dsh/commands/`
- **THEN** 指令层——`openspec instructions <artifact> --change <name>` SHALL 按 schema（工件链/模板/instruction 字段）与 `openspec/config.yaml`（context/rules）动态生成工件撰写指引，是每个工件撰写依据的唯一动态来源；代理 SHALL NOT 以机制层技能中的示例工序文字或文档层重复描述替代动态指令
- **THEN** 文档层——`CLAUDE.md` 工作流节 SHALL 仅承载 CLI 无法表达的约定（流水线/CI 门禁/验证/文档同步），工件格式与序列 SHALL 指向指令层（`openspec instructions <artifact>`）而不得重复撰写；CLAUDE.md 声明的工件序列 SHALL 与 schema 实际工件链一致，由 `openspec-check.mjs` 第 7 检自动校验

#### Scenario: 机制层随 CLI 升级重生成
- **WHEN** 升级 OpenSpec CLI（如 1.11.0 → 1.15.0）并运行 `openspec update` 刷新指令文件
- **THEN** 本机 `.dsh/skills/` 刷新为当前 CLI 版本内容（`generatedBy` 对应新版本），覆盖旧版本文件；因 `.dsh/` 不入库，本次刷新 SHALL NOT 产生 `git status` 变更

#### Scenario: 机制层本地生成不入库
- **WHEN** 新环境克隆仓库（无 `.dsh/`）并安装 OpenSpec CLI
- **THEN** 执行 `openspec init --tools dsh`（或 `openspec update`）生成 `.dsh/skills/openspec-*/SKILL.md` 共 12 个；`openspec/config.yaml` 保持已有 schema/context/rules 不变；`.dsh/` 始终不出现在版本控制中（`git ls-files .dsh` 为空）

#### Scenario: dsh 机制层仅保留 skills
- **WHEN** 检查 DeepSeek Harness 的机制层产物
- **THEN** 仅 `.dsh/skills/openspec-*/SKILL.md` 由 `openspec update` 生成与刷新；`.dsh/commands/` 与 `.claude/` SHALL NOT 存在（OpenSpec 官方 `dsh` 适配器无 command adapter，DSH harness 只扫描 `.dsh/skills` 与 `.agents/skills` 技能根），项目 SHALL NOT 人工镜像命令文件

#### Scenario: schema 变更不触发机制层重生成
- **WHEN** 修改自定义 schema（如新增 test-plan 工件）但 CLI 版本不变
- **THEN** `openspec update` 判定工具已最新（无强制项则无需更新），机制层内容保持不变；工件链变化仅经指令层透传，无需手改任何技能/命令文件

#### Scenario: 指令层透传自定义工件链
- **WHEN** 对自定义 schema 变更运行 `openspec instructions <artifact> --change <name>`
- **THEN** 输出包含 schema 定义的工件链/模板与 config.yaml 注入的 context/rules（如 test-plan 工件的 instruction 来自 schema.yaml 的 instruction 字段），不与 CLI 内建 spec-driven 工序示例混淆

#### Scenario: 文档层不重复指令层
- **WHEN** 代理撰写某个工件的具体内容
- **THEN** 依据 `openspec instructions <artifact>` 的动态输出（模板 + instruction + rules），CLAUDE.md 中无对应工件格式的重复副本
