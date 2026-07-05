# Design: 提交前本地验证流程

## Context

主题系统变更 `add-theme-system` 提交后 CI lint 门禁失败，暴露了本地验证不充分的问题。CI 有三层门禁（lint / tsc+build / test），但本地只验证了 build。

## Goals / Non-Goals

**Goals:**
- `package.json` 提供 `verify` 脚本，一键完成 lint + build
- CLAUDE.md 明确记录提交前验证约束

**Non-Goals:**
- 不改变 CI 配置（CI 自有分层，保持独立）
- 不添加 Git hooks

## Decisions

### Decision 1: `verify` 而非 `precommit`
- **选择**：`npm run verify` 作为脚本名
- **理由**：不与 Husky/lint-staged 等 Git hooks 工具冲突，名字清晰表达"验证"含义
- **备选方案**：`precommit` → 拒绝：容易被误解为 Git hook 自动化

## Risks / Trade-offs

无。仅新增一个 npm 脚本和文档段落，无破坏性变更。
