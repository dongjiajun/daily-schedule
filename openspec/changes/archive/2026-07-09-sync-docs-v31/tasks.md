# Tasks: 文档同步至 v3.1 并建立防退化机制

## 1. 文档修正

- [x] 1.1 更新 `docs/frontend/component-catalog.md`：组件树补全（useTheme、themes.css、colors.ts、主题状态），修正 ErrorBoundary/OnboardingGuide 位置
- [x] 1.2 更新 `docs/architecture.md`：测试矩阵 11 类/81 例 → 17 类/134 例，补 Auth 相关测试类
- [x] 1.3 更新 `docs/uml/README.md`：User 补 v3.0 字段、Event 补 status + EventFilter

## 2. OpenSpec 工作流改造

- [x] 2.1 更新 `openspec/schemas/spec-driven-custom/templates/tasks.md`：将"文档与收尾"提升为独立"文档同步"阶段，写清楚检查项
- [x] 2.2 更新 `openspec/config.yaml`：tasks rules 新增文档检查声明

## 3. CLAUDE.md 约束

- [x] 3.1 更新 CLAUDE.md"提交前验证"章节：增加"检查 docs/ 是否需要同步"

## 4. 验证

- [x] 4.1 `npm run verify` + `mvn test` 通过
- [x] 4.2 新 tasks 模板已包含"文档同步"独立阶段及 5 项检查清单
