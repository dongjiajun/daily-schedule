# Tasks: 回填 Event Lifecycle Spec

## 1. Spec 编写
- [x] 1.1 基于源码分析编写 `specs/event-lifecycle/spec.md`（6 个需求，14 个场景）
- [x] 1.2 填写 Test Coverage 表（11 ✅ / 2 ⚠️ 前端+Controller 盲区）

## 2. 验证
- [x] 2.1 逐场景对照源码确认行为描述准确
- [x] 2.2 运行 `mvn test` 确认所有已有测试通过（134 tests, 0 failures）

## 3. 文档同步（必须检查）
- [x] 3.1 新前端组件？→ 无
- [x] 3.2 新实体/表/字段？→ 无
- [x] 3.3 新 API 端点？→ 无
- [x] 3.4 架构/模块变动？→ 无
- [x] 3.5 全量验证: `mvn test`（134 tests passed）
