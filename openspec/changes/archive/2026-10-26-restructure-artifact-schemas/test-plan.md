# Test Plan: restructure-artifact-schemas

<!-- 模式 B（无独立测试面）：本变更为 schema/模板/CI 工具链重构，无运行时测试面。
     每行将 delta 场景映射到等价机械验证项（验证命令/CI 检查），由 apply 阶段实际执行并翻绿；
     归档前必须全 🟢（openspec-check 第 6 检）。 -->

| Requirement | Scenario | Test File / 验证项 | Test Name / 验证命令 | Initial State | Coverage Notes |
|-------------|----------|-------------------|----------------------|---------------|----------------|
| 三档 workflow schema 选择规则 | 默认档位为 standard | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| 三档 workflow schema 选择规则 | 小变更选用 lite | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| 三档 workflow schema 选择规则 | 复杂变更必须用 custom | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| 三档 workflow schema 选择规则 | schema 选择留痕 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | openspec-check 检查口径 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | 主 spec strict 漂移被拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | 活动变更 artifacts 不完整被拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | delta 头误入主 spec 被拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | CLI 版本声明漂移被拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | 归档变更 tasks 未全勾被拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | 钉版本安装与声明一致时 CI 绿 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | test-plan 门禁拦截风险 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | AGENTS.md 序列漂移被第 7 检拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | 机制层漂移被第 8 检拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | 模板单源漂移被第 9 检拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| CI 门禁执行 OpenSpec 一致性、机制层与模板单源校验 | 本地优先使用仓库内 CLI | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| 归档前验证门禁 | 验证门禁的两条适用口径 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| 归档前验证门禁 | 代码变更 verify 通过后归档 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| 归档前验证门禁 | 存在 CRITICAL 时归档被拦截 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| 归档前验证门禁 | 工具链变更等效替代验证 | `scripts/openspec-check.mjs` | `pnpm run openspec:check` | 🟢 | 模式 B（等价机械验证）：CI 九项检查通过，守卫脚本见 scripts/ |
| test-plan 内容契约（场景映射活账本） | 场景全覆盖 | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| test-plan 内容契约（场景映射活账本） | 初始红与翻绿 | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| test-plan 内容契约（场景映射活账本） | 无测试面场景留痕 | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| test-plan 内容契约（场景映射活账本） | 无测试面变更使用机械验证模式 | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| 红绿纪律与 spec 漂移停流 | 先红后绿 | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| 红绿纪律与 spec 漂移停流 | spec 漂移即停 | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| 范围与模板同步纪律 | lite 变更无 test-plan | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| 范围与模板同步纪律 | standard 变更无 test-plan | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| 范围与模板同步纪律 | custom 模板变更后 lite 同步 | `openspec/schemas/spec-driven-custom/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（test-plan 双模式） |
| 轻量 artifact 链（proposal → specs → tasks） | 小变更走 lite 链 | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 轻量 artifact 链（proposal → specs → tasks） | 默认 schema 不受影响 | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 适用范围 | 小行为变更用 lite | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 适用范围 | 中等变更用 standard | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 适用范围 | 复杂变更不得用 lite | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 适用范围 | 工具链变更 skip_specs 通用 | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 模板单源化与同步纪律 | custom 模板变更后 lite 同步 | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 模板单源化与同步纪律 | lite 冒烟验证 | `openspec/schemas/spec-driven-custom-lite/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-lite` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（tasks 1/2/3） |
| 工件链为 proposal → specs → design → tasks | standard 变更生成 4 工件 | `openspec/schemas/spec-driven-custom-standard/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-standard` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（4 工件链） |
| 工件链为 proposal → specs → design → tasks | 无 test-plan 工件 | `openspec/schemas/spec-driven-custom-standard/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-standard` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（4 工件链） |
| 模板单源与结构纪律 | custom 模板变更后 standard 同步 | `openspec/schemas/spec-driven-custom-standard/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-standard` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（4 工件链） |
| 模板单源与结构纪律 | standard 模板冒烟 | `openspec/schemas/spec-driven-custom-standard/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-standard` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（4 工件链） |
| 适用范围与档位选择 | 中等变更用 standard | `openspec/schemas/spec-driven-custom-standard/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-standard` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（4 工件链） |
| 适用范围与档位选择 | 复杂变更不得用 standard | `openspec/schemas/spec-driven-custom-standard/schema.yaml` | `pnpm exec openspec schema validate spec-driven-custom-standard` | 🟢 | 模式 B：schema 校验 + instructions 冒烟（4 工件链） |
