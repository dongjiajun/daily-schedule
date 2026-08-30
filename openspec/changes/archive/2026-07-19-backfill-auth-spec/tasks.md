# Tasks: 回填 Authentication Spec
<!-- backfilled: 2026-08-30 (change: backfill-archive-task-completion) — 勾选补正：任务均已落地（功能/修复/验证在 v3.5.1 生效）；用户跟进观感项已移交用户实机目测 -->

## 1. Spec 编写
- [x] 1.1 基于源码分析编写 `specs/authentication/spec.md`（8 个需求，26 个场景）
- [x] 1.2 填写 Test Coverage 表，审计现有测试与场景的映射关系

## 2. 验证
- [x] 2.1 逐场景对照源码确认行为描述准确（基于 agent 代码级分析验证）
- [x] 2.2 运行 `mvn test` 确认所有已有测试通过（134 tests, 0 failures）
- [x] 2.3 运行 `/opsx:verify` 确认 spec 场景与实现一致

## 3. 文档同步（必须检查）
- [x] 3.1 新前端组件？→ 无
- [x] 3.2 新实体/表/字段？→ 无
- [x] 3.3 新 API 端点？→ 无
- [x] 3.4 架构/模块变动？→ 无
- [x] 3.5 全量验证: `mvn test`（134 tests passed）
