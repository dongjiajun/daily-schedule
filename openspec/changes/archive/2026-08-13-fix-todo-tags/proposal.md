# Proposal: fix-todo-tags

## Why
任务看板/列表的标签功能是"写入成功、读取丢失"的半截链路:标签关联正常入库(task_tags),但查询响应永远返回空数组,前端 TaskCard/TaskRow 已消费 `task.tags` 却永远渲染不出标签。契约(specs/openapi.yaml `TaskProfile.tags`)与主 spec(task-crud)均已承诺该字段,属实现未兑现既有需求。

## What Changes
- 后端读取路径补齐标签关联:`TaskRepositoryImpl.findById` / `findByUserId` 批量回填任务标签,参照 `EventRepositoryImpl.loadWithTags` 防 N+1 模式
- `TodoAssembler.toTaskProfile` 从任务标签构建 `TagResponse`(参照 `EventAssembler.buildTagResponses`),移除写死的 `Collections.emptyList()`
- `TodoAssembler` 新增 `toDomain(CreateTaskRequest)` / `toDomain(UpdateTaskRequest)`,`TodoController` 去除手工字段拷贝(对齐 EventAssembler 职责,6 个 assembler 中唯一缺 toDomain 的补齐)
- 测试补盲:新增 `TodoAssemblerTest`;`TaskRepositoryImplTest` 补标签加载/回填用例

## Capabilities

### New Capabilities
无

### Modified Capabilities
- `task-crud`: 补充需求级澄清——所有 `TaskProfile` 响应(列表/详情/创建/更新)的 `tags` 字段 SHALL 填充任务实际关联的标签(TagResponse 数组),不再为空数组

## API Contract Impact
无——`specs/openapi.yaml` 已声明 `TaskProfile.tags`(TagResponse 数组)与 `CreateTaskRequest.tagIds` / `UpdateTaskRequest.tagIds`,本变更仅补齐后端实现,契约零改动,版本号无需同步。

## DDD Layer Impact
- 领域层: `domain/task/Task` 增加关联标签持有(与 `domain/event/Event` 对齐,保留 tagIds 写入语义)
- 基础设施层: `TaskRepositoryImpl` / `TaskTagMapper` 读取路径批量回填(写入路径已实现,不动)
- API 层: `TodoAssembler`(填充 tags + 新增 toDomain)、`TodoController`(去除手工字段拷贝)
- 应用层: 无变化

## Database Impact
无需新 Flyway 迁移——`tasks` / `task_tags` 表已存在,写入路径(TaskRepositoryImpl.save/update)已实现,本变更仅补读取路径。

## Impact
- 后端: `TaskMapper` / `TaskTagMapper`(新增联查)、`TaskRepositoryImpl`、`TodoAssembler`、`TodoController`
- 前端: 无代码改动(TaskCard/TaskRow 已消费 `task.tags`,修复后自然显示)
- 测试: 新增 `TodoAssemblerTest` + `TaskRepositoryImplTest` 标签用例
- 文档: 无契约/表结构变化,`docs/api/overview.md` 与 `docs/database/schema.md` 逐项核对即可
