# Proposal: <!-- 变更名称 -->

## Why
<!-- 1-2 句说明动机：解决什么问题？为什么现在做？ -->
<!-- 参考：v3.1 已完成状态闭环 + 拖拽 + 标签筛选，优先考虑用户体验连贯性 -->

## What Changes
<!-- 具体变更清单 -->
- 
<!-- 标记 BREAKING 变更：**BREAKING** 涉及 API 契约不兼容时务必标注 -->

## Capabilities

### New Capabilities
<!-- 新增能力，kebab-case 命名 (如 event-recurrence, dark-mode, ics-import)
     每个将生成 specs/<name>/spec.md -->
- `<name>`: <简述>

### Modified Capabilities
<!-- 仅列需求级变更（非实现细节），用 openspec/specs/ 下的已有名称 -->
- `<existing-name>`: <需求变更说明>

## API Contract Impact
<!-- 是否需修改 specs/openapi.yaml？ -->
<!-- 新增端点：POST/GET/PUT/DELETE /api/v1/<path> -->
<!-- 修改端点：字段变更、响应结构变更 -->
<!-- 无影响：-->

## DDD Layer Impact
<!-- 标记变更触碰的后端层级： -->
<!-- API 层 (controller/assembler) / 应用层 (ApplicationService) / 领域层 (Entity/DomainService/Repository) / 基础设施层 (persistence/security/scheduled/notification) -->

## Database Impact
<!-- 是否需要新 Flyway 迁移 (V5, V6...)？涉及哪些表/列？ -->
<!-- 无需：-->

## Impact
<!-- 受影响的代码模块、前端组件、依赖、文档 -->
