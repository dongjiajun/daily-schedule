# Pre-commit Verify

## ADDED Requirements

### Requirement: 前端提供一键验证脚本
`frontend/package.json` SHALL 包含 `verify` 脚本，SHALL 执行 `npm run lint && npm run build`，确保 lint 和 TypeScript 编译同时通过。

#### Scenario: 开发者提交前端代码前验证
- **WHEN** 开发者在 `frontend/` 目录执行 `npm run verify`
- **THEN** 系统顺序执行 ESLint 检查和 TypeScript 编译 + Vite 构建，任一失败则整体 exit code ≠ 0

#### Scenario: CI lint 失败后本地复现
- **WHEN** CI 远端报告 lint 失败
- **THEN** 开发者可在本地运行 `npm run verify` 精确复现相同错误

### Requirement: CLAUDE.md 记录提交前验证流程
CLAUDE.md SHALL 包含"提交前验证"章节，列明每次提交前必须运行的验证命令和 CI 三层门禁说明。

#### Scenario: 新 Claude 实例读取项目约束
- **WHEN** 新会话加载 CLAUDE.md
- **THEN** AI 知晓提交前必须通过 `npm run verify` + `mvn test`
