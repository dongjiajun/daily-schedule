# Test Plan: <!-- 变更名称 -->

<!-- 将 delta specs 中每个 `#### Scenario:` 逐条映射为可执行验证项。表头固定 6 列，前两列
     Requirement / Scenario 不可改名（CI 解析器只读取前两列）：
     Requirement | Scenario | Test File / 验证项 | Test Name / 验证命令 | Initial State | Coverage Notes

     按变更是否有独立测试面选择模式（全表统一；确需混合时在 Coverage Notes 标明所属模式）：
     - 模式 A（有独立测试面）：沿用现有 6 列账本，将每个场景映射到命名测试（测试文件 + 测试类/方法名），红绿翻转
     - 模式 B（无测试面：工具链/文档/配置/纯 CI 脚本变更）：把每个场景映射到等价机械验证项
       （验证命令或 CI 检查名，如 `node scripts/openspec-check.mjs --self-test`），仍需逐场景一行，
       Coverage Notes 注明「等价机械验证」及理由
     禁止虚标测试文件：模式 B 不得编造测试文件/测试名，以实际可执行的验证命令或 CI 检查名为准。

     纪律：
     - 每个场景必须有对应行，Requirement/Scenario 引用与 delta specs 一致，无遗漏
     - 未实现场景 Initial State 记 🔴；实现且对应测试/验证项通过后改写 🟢（归档前必须全绿）
     - apply 时逐场景先写/改测试（或验证项）确认失败（红），再实现至通过（绿）；
       spec 漂移即停：更新 delta spec 与 test-plan 后继续 -->

| Requirement | Scenario | Test File / 验证项 | Test Name / 验证命令 | Initial State | Coverage Notes |
|-------------|----------|--------------------|----------------------|---------------|----------------|
| <!-- R1 --> | <!-- S1 happy-path --> | `backend/src/test/java/...` | `EventServiceTest.createEvent_success` | 🔴 → 🟢 | 模式 A：正常路径 |
| <!-- R2 --> | <!-- S2 failure/edge --> | `e2e/...spec.ts` | `event.spec.ts > 失败路径` | 🔴 → 🟢 | 模式 A：异常/边界 |
| <!-- R3 --> | <!-- S3（工具链变更） --> | `node scripts/openspec-check.mjs --self-test`（CI: openspec-validation） | `node scripts/openspec-check.mjs --self-test` | 🔴 → 🟢 | 模式 B：等价机械验证（无独立测试面；理由：纯脚本/配置变更） |

<!-- 示例行带注释占位，CI 会跳过；替换为实际场景后删除注释。实际填写时删除未使用的模式示例行。 -->
