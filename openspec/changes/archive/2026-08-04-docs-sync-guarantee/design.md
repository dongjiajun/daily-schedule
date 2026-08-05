# Design: docs-sync-guarantee

## Context
`docs/` 6 份文档与代码全面漂移（版本号滞后 4 个小版本、前端测试数 43→45 未同步、SSE 鉴权仍描述已废弃的 `?token=` 方案、ER 图缺 5 张表、UML 的 Pet 方法签名虚构、18 套节日主题未收录）。根因：现有 doc-sync-workflow 三层机制（tasks 模板"文档同步"阶段 / config.yaml rules / CLAUDE.md 检查清单）只覆盖"新增"场景且无自动化验证；最近 8 个变更中 6 个为纯前端"修改"类，全部落在规则盲区。

约束：
- 不改 API 契约（`specs/openapi.yaml` 版本 3.3.4 不动，除非后续 API 变更）
- 无后端代码变更（DDD 四层均不触碰）
- CI 现有 job 结构（version-check / backend / frontend / e2e）不重构，只允许在 version-check job 内加 step
- 检查脚本须 Windows 本地（git-bash）与 CI（ubuntu）双环境可用 → 用 Node 而非 bash 专有语法

## Goals / Non-Goals

**Goals:**
- 规则层：config.yaml `rules.tasks` 从"新增触发"升级为"新增+修改全触发"，并覆盖 architecture.md / CLAUDE.md / README.md / 版本声明
- 模板层：tasks 模板"8. 文档同步"阶段从"无新增 → N/A"改为"逐项评估现有描述是否仍准确"
- 自动化层：新增文档一致性检查脚本，独立验证版本号 / 端点清单 / 结构计数，接入 CI 门禁
- 存量层：6 份文档一次修复至与代码一致，修复后 docs-check 全绿

**Non-Goals:**
- 不引入 UML 自动生成工具（PlantUML 等），uml 仅做修复 + 声明降级
- 不统一文档语言/风格/排版
- 不改 OpenSpec CLI / schema 定义文件
- 不改 CI job 结构（不加新 job，不改变现有 job 的 failure 语义）
- 不做文档多语言或国际化

## Decisions

### Decision 1: 文档检查脚本用独立 Node 脚本（`scripts/docs-check.mjs`）而非 vitest 测试
- **选择**: `scripts/docs-check.mjs`，root `package.json` 加 `"docs:check"` script；CI 在 version-check job 内加一步 `node scripts/docs-check.mjs`
- **理由**: (1) 检查对象是跨前后端的仓库级事实（openapi.yaml、docs/、迁移脚本、domain 计数），不属于前端测试套件职责； (2) 独立脚本**不改变 frontend 测试文件数**——若用 vitest 实现，检查文件自身会改变 CLAUDE.md 声明的测试数，形成自引用漂移； (3) version-check job 已有 Node 22 环境（`sync-version.sh` 同 job 使用），零新增 CI 基础设施； (4) Node 无 bash 平台差异，Windows/CI 双环境一致
- **备选方案**: (a) vitest 测试文件——被自引用问题否决； (b) 扩展 `scripts/sync-version.sh`——只擅长版本号，端点/计数检查用 bash 解析脆弱且不跨平台； (c) Python/GitHub Action 独立 job——新增运行时依赖/CI 复杂度，收益不成比例

### Decision 2: 可独立验证的检查项采用"文档 marker + 脚本从真相源重算"模式
- **选择**: 文档中可独立验证的数值声明处就地标注 `<!-- DOCS-CHECK: <key>=<value> -->`；脚本对每个已知 key 从代码树/契约重算真实值并比对。检查项分为两类：
  - **版本类**（真相源 = `specs/openapi.yaml` version）：overview.md "当前 API 版本"、schema.md "当前状态"、execution-plan.md "当前实际版本"、CLAUDE.md "当前版本" 四处声明与契约版本一致
  - **计数类**（真相源 = 代码树，脚本现场数出）：`frontend-test-files`（glob `frontend/src/**/*.test.*`）、`backend-test-classes`（glob `backend/src/test/**/*Test.java`）、`domain-files`（`domain/**/*.java`）、`specs-count`（`openspec/specs/` 目录数）、`e2e-files`（`e2e/*.spec.ts`）、`theme-sets`（themes.css `data-theme` 去重数）、`holiday-themes`（holiday-themes.css 去重数）、`ui-components`（`core/components/ui/` 文件数）
- **理由**: 计数类声明在文档正文里是自然语言（"45 文件 195 用例"），脚本无法稳定解析；marker 把声明位置与期望值显性化，脚本只做"从代码树重算 ↔ marker 比对"，零解析歧义。版本类不依赖 marker，脚本直接提取文档版本号短语比对，避免 marker 与正文不一致的双份维护
- **备选方案**: (a) 无 marker 全靠正则解析正文——解析脆弱（"45 文件"与"195 用例"同句）； (b) marker 只做提醒不验证——退化为口头约定，无意义； (c) 全部检查硬编码期望值于脚本——脚本与文档双处维护，漂移源转移

### Decision 3: 端点覆盖检查采用"openapi 全端点 → overview 出现性"单方向强检查 + 白名单
- **选择**: 从 `specs/openapi.yaml` 提取全部 `^  /` 路径（当前 19 条）；在 `docs/api/overview.md` 全文提取路径 token（`/` 开头的 token，含 `{id}` 归一化）做出现性匹配；openapi 端点未在 overview 出现即失败；反向（overview 存在而 openapi 无）仅告警，人工确认后加入脚本白名单
- **理由**: 正向检查是防"新增端点忘写文档"的核心；反向检查噪音大（示例/叙述中的路径碎片），降级为告警 + 白名单，避免 CI 误伤
- **备选方案**: (a) 双向严格检查——误报面大； (b) 用 YAML 解析库（js-yaml）加载 openapi——引入新依赖，`^  /` 行提取已足够且零依赖

### Decision 4: tasks 模板"8. 文档同步"改为逐项评估语义
- **选择**: 模板中 8.x 条目从"新增 → 任务；无新增 → N/A"改为固定五条评估 + 一条验证：
  ```
  ## 8. 文档同步（逐项评估——未触及的文档类别也必须写明"现有描述已核对，仍准确"）
  - [ ] 8.1 component-catalog.md：本次变更触及组件/目录？→ 更新；未触及 → 核对结论
  - [ ] 8.2 schema.md + uml/README.md：触及表/字段/领域模型？→ 更新；未触及 → 核对结论
  - [ ] 8.3 api/overview.md：触及端点/契约？→ 更新；未触及 → 核对结论
  - [ ] 8.4 architecture.md + CLAUDE.md：触及架构/模块/版本/测试数？→ 更新；未触及 → 核对结论
  - [ ] 8.5 README.md：触及版本/功能清单？→ 更新；未触及 → 核对结论
  - [ ] 8.6 `node scripts/docs-check.mjs` 通过
  ```
- **理由**: 8.x 标记 N/A 合规曾是漏检的合法通道（抽查 pet-roam-robustness：8.1-8.3 全 N/A 且全漏）。要求每条写核对结论后，"无变更"与"没检查"从字面上可区分
- **备选方案**: 保持现状仅改 config rules——模板不约束具体任务，AI 仍可能省略核对

### Decision 5: config.yaml rules.tasks 扩展为"新增+修改"并补三类新规则
- **选择**: 修改既有三条（新增 → 新增或修改），新增三条：
  - MODIFIED: "涉及新前端组件**或修改现有组件行为**时…component-catalog.md"
  - MODIFIED: "涉及新实体/数据库表/字段**或修改表结构/领域模型**时…schema.md + uml/README.md"
  - MODIFIED: "涉及新 API 端点**或修改现有端点**时…api/overview.md"
  - ADDED: "涉及架构/模块结构/测试规模/版本号变更时…architecture.md + CLAUDE.md + README.md"
  - ADDED: "8. 文档同步阶段条目必须逐项评估（未触及的类别须写明核对结论），不得仅以'无新增'标记 N/A"
  - ADDED: "文档同步完成后必须运行 `node scripts/docs-check.mjs` 且通过"
- **理由**: 规则的约束力在 artifact 生成期生效（AI 生成 tasks 时读取 rules）；把"修改"场景与评估语义写进规则，才能让生成的任务列表天然包含文档核对
- **备选方案**: 只改模板不改 rules——模板约束弱于规则，生成时仍可能跳过

### Decision 6: uml/README.md 防再漂移 = 修复 + 头部降级声明
- **选择**: 存量修复（Pet 方法改为 `applyInteraction(InteractionResult)` / `applyDecay(int, int)`；删除虚构的 PetInteraction 类；补 User→Pet/Task 归属关系与 task_tags 关联；ER 图补充 5 表），并在文件头部加声明："领域模型图用于表达实体关系与字段，**方法签名以代码为准**（改方法不改关系时不必更新本图）"
- **理由**: 方法签名级细节是 ASCII 手工图的最大漂移源（本次 Pet 方法即虚构）；声明后方法级改动不再强制触发 uml 更新，减少无效 churn，同时关系级漂移仍由 8.2 评估兜住
- **备选方案**: (a) 引入 PlantUML 自动生成——新依赖 + 学习成本，Non-Goal； (b) 删除方法签名仅留字段/关系——损失信息，且与现有 Event 模型风格不一致

### Decision 7: 存量 6 文档修复在同一变更内完成
- **选择**: 本变更的 tasks 包含全部 6 份文档的差异修复（版本号 3.3.4、测试数 45/195/33、SSE Cookie 描述、ER 图 5 表、UML 关系、holiday-themes 18 套、modules/pet|todo 目录补齐、ErrorBoundary 路径矛盾等），修复后 `docs-check` 全绿为完成判据
- **理由**: 存量修复与机制改造同变更，验收标准统一（脚本全绿），避免"机制先上、存量文档拖后"造成新机制上线即失败
- **备选方案**: 机制先行、存量修复单独变更——验收悬空，不采纳

## DDD Layer Design
无后端代码变更（领域层 / 基础设施层 / 应用层 / API 层均不触碰）。本变更仅涉及仓库级脚本与文档，DDD 四层标注 N/A。

### 前端 (frontend/src/)
无前端代码变更。`frontend/src/` 的目录/文件仅作为 docs-check 的计数对象（glob 提取），不被本变更修改。

## API Design
无 API 变更。`specs/openapi.yaml` 作为 docs-check 的版本与端点真相源被读取，本身不修改。新增端点文档遗漏将由 checkEndpoints 在 CI 拦截。

## Database Design
无数据库变更（不新增 Flyway 迁移）。`backend/src/main/resources/db/migration/` 仅作为文档核对的事实来源（schema.md 已与 V1-V6 核对一致，本次修复不改表结构部分）。

## Risks / Trade-offs
- [marker 自证陷阱：人同步改 marker 与代码但正文描述仍错] → marker 仅用于可独立验证的计数项；语义类内容（如"SSE 用 Cookie"）不设 marker，由 8.x 逐项评估 + 变更评审兜住。设计上明确区分两类检查
- [检查脚本正则解析脆弱（openapi version 行、端点行格式变化）] → 只解析稳定结构（`^\s+version:`、`^  /`），格式变更时脚本失败信息给出修复指引；检查项失败只阻断 docs-check 单步，不影响其他 CI job
- [端点反向检查告警噪音累积] → 白名单集中在脚本常量区，任务模板要求新白名单条目注明理由
- [存量修复面大（6 文档 + marker 注入），易遗漏] → 按差异矩阵逐文件开 task（每个文档一个任务条目），收尾统一跑 docs-check + 人工 smoke 核对
- [rules/模板修改对后续变更生成的影响] → 本变更自身的 tasks 即按新语义书写，作为新模板的首个真实用例（smoke）

## Migration Plan
1. 编写 `scripts/docs-check.mjs` + root `package.json` `docs:check` script + CI step（version-check job）
2. 修复 6 份存量文档 + 注入 marker（修复后 docs-check 全绿）
3. 修订 `openspec/config.yaml` rules.tasks + tasks 模板 8.x
4. 修订 CLAUDE.md（文档检查章节措辞 + 版本声明 + 测试数）+ README.md（如涉及）
5. 同步 `openspec/specs/doc-sync-workflow/spec.md`（delta：MODIFIED 三层机制需求 + ADDED 自动化检查需求）
6. 全量验证：`node scripts/docs-check.mjs` + `turbo run verify` + 后端 `mvn test` + E2E 回归

回滚策略：本变更为流程+文档变更，无运行时部署；回滚 = 还原上述文件（git revert），CI step 移除即恢复原门禁语义。

## Open Questions
- 端点反向检查告警的初始白名单条目数（写 tasks 时以 docs-check 首跑输出为准）
- `execution-plan.md` 的"当前实际版本"声明是否纳入 version 检查（当前设计：纳入，作为第 4 处声明）——若规划文档版本更新节奏不匹配契约版本，可在 tasks 阶段降级为告警
