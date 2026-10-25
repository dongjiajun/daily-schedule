# Pre-commit Verify

## REMOVED Requirements

### Requirement: CLAUDE.md 记录提交前验证流程
**Reason**: 文档层文件名由 `CLAUDE.md` 变更为 `AGENTS.md`，且场景名去除 Claude 品牌；原需求整体由重命名后的新需求承接。
**Migration**: 由本变更 ADDED 的「AGENTS.md 记录提交前验证流程」承接（内容等价，doc 文件名与场景名同步更新）。

## ADDED Requirements

### Requirement: AGENTS.md 记录提交前验证流程
AGENTS.md SHALL 包含"提交前验证"章节，列明每次提交前必须运行的验证命令和 CI 三层门禁说明。

#### Scenario: AI 会话读取项目约束
- **WHEN** 新会话加载 AGENTS.md
- **THEN** AI 知晓提交前必须通过 `npm run verify` + `mvn test`
