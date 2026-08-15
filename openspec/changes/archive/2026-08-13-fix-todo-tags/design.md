# Design: fix-todo-tags

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context

任务标签是"写入成功、读取丢失"的半截链路:

- **写入路径完整**: `TaskRepositoryImpl.save/update` 正常维护 `task_tags` 关联（先删后插）
- **读取路径断裂**: `TaskMapper.selectByFilter` 仅 `SELECT t.* FROM tasks`；`TaskRepositoryImpl.findById/findByUserId` 不回填标签；`TodoAssembler.toTaskProfile` 写死 `Collections.emptyList()`（注释"标签由 Controller 填充"但 Controller 从未填充）
- **契约已承诺**: `specs/openapi.yaml` `TaskProfile.tags`（TagResponse 数组）+ `CreateTaskRequest/UpdateTaskRequest.tagIds` 均已声明；主 spec `task-crud` 已要求"返回 201 + TaskProfile（含 tags 数组）"
- **前端已消费**: `TaskCard/TaskRow` 渲染 `task.tags`，修复后自然显示，前端零改动
- **参照模式已存在**: Event 侧完整链路——`EventTagMapper.selectTagsByEventIds`（JOIN 批量）→ `EventRepositoryImpl.loadWithTags`（分组回填 `tags` + `tagIds`）→ `EventAssembler.buildTagResponses`（转 TagResponse）

约束：DDD 依赖方向 API → 应用 → 领域 ← 基础设施；PO↔Domain 转换收口在 RepositoryImpl；H2 单测 + MySQL 生产。

## Goals / Non-Goals

**Goals:**
- 列表/详情/创建/更新所有 `TaskProfile` 响应的 `tags` 填充实际关联标签（TagResponse: id/name/color）
- 参照 Event 侧既有模式，防 N+1
- 补齐 `TodoAssembler.toDomain`，消除 TodoController 手工字段拷贝
- 补 `TodoAssemblerTest` + TaskRepositoryImpl 标签用例

**Non-Goals:**
- 不改 `task_tags` 写入路径、不动表结构（无 Flyway 迁移）
- 不改 openapi.yaml、不改前端代码
- 不修任务模块其他问题（moveTask 排序死代码 P11、updateStatus 非原子 P17 等，见打磨期延后清单）
- 不做标签排序（task_tags 无顺序列，与 Event 侧行为一致）

## Decisions

### Decision 1: 标签读取采用"JOIN 批量查询 + RepositoryImpl 分组回填"（照搬 Event 模式）
- **选择**: `TaskTagMapper` 新增 `selectTagsByTaskIds(Collection<Long> taskIds)`（`task_tags JOIN tag`，投影 `TaskTagJoinRow{taskIdRef, id, name, color, createdAt, updatedAt}`）；`TaskRepositoryImpl` 新增私有 `loadWithTags(List<TaskPO>)`，在 `findById`/`findByUserId` 中调用
- **理由**: 与 `EventRepositoryImpl.loadWithTags` 完全同构（`EventTagMapper.selectTagsByEventIds` + `EventTagJoinRow`）；一次批量查询防 N+1；PO↔Domain 转换收口在 RepositoryImpl，不泄漏到应用/API 层
- **备选方案**: ① `TaskMapper.selectByFilter` 直接 LEFT JOIN + GROUP_CONCAT——驳回：GROUP_CONCAT 有长度上限、跨库兼容差、需手工解析字符串；② 每个任务单查 `selectTagsByTaskId`——驳回：N+1，列表 50 任务即 51 次查询

### Decision 2: domain Task 增加 `List<Tag> tags`（只读回填），保留 `List<Long> tagIds`（写入语义）
- **选择**: `Task` 新增 `private List<Tag> tags = new ArrayList<>()` + getter/setter；`tagIds` 保持现状（save/update 写入用）
- **理由**: 与 Event 双字段模式（`tagIds` 写入 + `tags` 回填）完全对齐；写入路径零改动，Tag 引用方向与 Event 一致（domain/task → domain/tag 已由 Event 先例证明可行）
- **备选方案**: 仅靠 `tagIds` + API 层查 TagRepository 组装——驳回：装配逻辑泄漏到 API/应用层、响应路径额外查询

### Decision 3: save/update 后由 RepositoryImpl 用 `TagMapper.selectBatchIds` 回填 tags
- **选择**: `TaskRepositoryImpl` 注入 `TagMapper`；`save`/`update` 返回前按 `task.getTagIds()` 批量查询 Tag 实体回填 `task.tags`
- **理由**: 满足 spec 场景"返回 201 + TaskProfile（含 tags 数组）"；与读取路径共用同一回填语义，Controller 无感知
- **备选方案**: 由 Controller/应用层回填——驳回：逻辑散落多处，且创建/更新/查询三条路径要写三遍

### Decision 4: TodoAssembler 补齐 toDomain 并删除未使用的两参重载
- **选择**: 新增 `toDomain(CreateTaskRequest)` / `toDomain(UpdateTaskRequest)`（含 `TaskPriority.fromString` 转换与 tagIds 拷贝，参照 `EventAssembler.toDomain`）；`toTaskProfile(Task)` 改为从 `task.getTags()` 构建 TagResponse（参照 `EventAssembler.buildTagResponses`），移除 `Collections.emptyList()`；删除 `toTaskProfile(Task, List<TagResponse>)` 两参重载（实施前 grep 确认无调用者）
- **理由**: 6 个 assembler 中唯一缺 toDomain 的补齐，Controller 手工字段拷贝（TodoController.java:40-49, 57-66）消除；职责对齐 EventAssembler
- **备选方案**: 保留两参重载供 Controller 填充——驳回：填充职责已收口到单参版本（Task 携带 tags），两参重载成为死代码

## DDD Layer Design

### 领域层 (domain/)
- `domain/task/Task`：新增 `List<Tag> tags` 字段（默认空列表）+ getter/setter。无其他变更

### 基础设施层 (infrastructure/)
- `persistence/mapper/TaskTagMapper`：新增 `selectTagsByTaskIds(Collection<Long> taskIds)`（`<script>` foreach IN 查询，JOIN `tag` 表）+ 内部类 `TaskTagJoinRow`（对照 `EventTagMapper.EventTagJoinRow`）
- `persistence/repository/TaskRepositoryImpl`：
  - 注入 `TagMapper`
  - 新增私有 `loadWithTags(List<TaskPO>)`：空列表直接返回；按 id 分组 JOIN 结果，回填 `tags`（List<Tag>）与 `tagIds`（List<Long>，覆盖 PO 中的空值）
  - `findById` / `findByUserId` 改走 `loadWithTags`
  - `save` / `update` 返回前用 `TagMapper.selectBatchIds` 回填 `task.tags`

### 应用层 (application/)
- 无变化（`TodoApplicationService` 编排不动）

### API 层 (api/)
- `api/assembler/TodoAssembler`：新增两个 `toDomain` 重载；`toTaskProfile` 单参版本构建 tags；删除两参重载
- `api/controller/TodoController`：`createTask`/`updateTask` 改调 `TodoAssembler.toDomain`，删除手工 `new Task()` + 逐字段 set

### 前端 (frontend/src/)
- 零改动（`TaskCard`/`TaskRow` 已消费 `task.tags`，SDK 类型已含 `tags`）

## API Design

契约零变更。受影响端点（行为修复，schema 不变）：

- `GET /tasks` → `TaskProfile[]`，每个 `tags` 填充实际关联标签（此前恒空）
- `POST /tasks` → 201 + `TaskProfile`，`tags` 反映请求的 tagIds
- `PUT /tasks/{id}` → 200 + `TaskProfile`，`tags` 反映更新后的关联
- `PUT /tasks/{id}/move` → 返回的 `TaskProfile` 同样经 `toTaskProfile` 填充 tags（顺带修复）

错误码不变；无需重新生成前端 SDK。

## Database Design

无表结构变更、无 Flyway 迁移。仅新增只读 JOIN 查询：

```sql
SELECT tt.task_id AS task_id_ref,
       t.id, t.name, t.color, t.created_at, t.updated_at
FROM task_tags tt JOIN tag t ON tt.tag_id = t.id
WHERE tt.task_id IN (...)
```

## Risks / Trade-offs

- [标签返回顺序不稳定（task_tags 无顺序列）] → 与 Event 侧行为一致，接受；前端无顺序依赖
- [空 taskIds 集合传入 IN 查询导致 SQL 语法问题] → `loadWithTags` 入口先判空返回（Event 模式已有此守卫）
- [删除两参重载可能破坏其他调用者] → 实施前 grep 确认；若有调用者则保留重载
- [H2 与 MySQL JOIN 行为差异] → 查询为标准 INNER JOIN，两侧兼容；`TaskRepositoryImplTest`（H2）直接覆盖

## Migration Plan

- 部署：仅后端构建产物变更（无 SQL 迁移、无前端资源、无 SDK 重生成），`mvn test` + `pnpm run docs:check` 通过后合入
- 回滚：纯代码变更，回滚提交即恢复旧行为（tags 恒空）
- 数据：`task_tags` 存量数据无需处理，修复后立即生效

## Open Questions

无
