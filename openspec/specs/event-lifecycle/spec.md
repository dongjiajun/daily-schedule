# event-lifecycle Specification

## Purpose
TBD - created by archiving change backfill-event-lifecycle-spec. Update Purpose after archive.
## Requirements
### Requirement: Event 具有三种生命周期状态
系统 SHALL 定义 `EventStatus` 枚举：`PLANNED`（计划中）、`COMPLETED`（已完成）、`CANCELLED`（已取消）。新建事件时默认状态 SHALL 为 `PLANNED`。`fromString(null)` SHALL 返回 `PLANNED`。数据库列 `status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'` SHALL 保证所有已有事件有默认值。

#### Scenario: 新建事件默认状态
- **WHEN** 创建事件时未指定 status
- **THEN** 事件 status 为 PLANNED

#### Scenario: fromString(null) 返回 PLANNED
- **WHEN** 调用 `EventStatus.fromString(null)`
- **THEN** 返回 `EventStatus.PLANNED`

### Requirement: isActive 门禁控制事件参与提醒和冲突检测
系统 SHALL 定义 `Event.isActive()`：当 `status == null || status == PLANNED` 时返回 `true`，COMPLETED 或 CANCELLED 时返回 `false`。提醒调度器 SHALL 在 SQL 查询中过滤 `status='PLANNED'`（而非调用 `isActive()`）。冲突检测 SHALL 调用 `isActive()` 过滤非活跃事件。

#### Scenario: PLANNED 事件参与冲突检测
- **WHEN** 创建新 PLANNED 事件时，存在一个 PLANNED 事件在相同时段
- **THEN** 冲突检测报告冲突（`isActive()` 为 true）

#### Scenario: COMPLETED 事件不参与冲突检测
- **WHEN** 创建新 PLANNED 事件时，存在一个 COMPLETED 事件在相同时段
- **THEN** 冲突检测不报告冲突（`isActive()` 为 false）

#### Scenario: CANCELLED 事件不触发提醒
- **WHEN** 提醒调度器查询待提醒事件
- **THEN** SQL 查询 `WHERE status='PLANNED'` 排除 CANCELLED 事件

### Requirement: 创建事件时检测时间冲突
`EventApplicationService.create()` SHALL 查询同时段（`[startTime-1min, endTime+1min]`）的已有事件，调用 `EventDomainService.hasTimeConflict()` 检测冲突。冲突检测 SHALL 排除自身（同 ID）、排除非活跃事件。时间重叠判断 SHALL 为半开区间：`this.startTime < other.endTime AND this.endTime > other.startTime`——相邻事件（如 9:00-10:00 和 10:00-11:00）不视为冲突。有冲突时 SHALL 抛出 `IllegalArgumentException("该时段已有其他日程，请调整时间")`。

#### Scenario: 时间段重叠报告冲突
- **WHEN** 创建 09:00-11:00 事件时，已存在 10:00-12:00 的 PLANNED 事件
- **THEN** 抛出 IllegalArgumentException

#### Scenario: 时间段相邻不报告冲突
- **WHEN** 创建 10:00-11:00 事件时，已存在 09:00-10:00 的 PLANNED 事件
- **THEN** 无冲突，正常创建（边界相同但半开区间不重叠）

#### Scenario: 完全包含报告冲突
- **WHEN** 创建 09:00-12:00 事件时，已存在 10:00-11:00 的 PLANNED 事件
- **THEN** 抛出 IllegalArgumentException

#### Scenario: 编辑自身不报告冲突
- **WHEN** 更新事件 A 的时间，同时存在事件 A（同 ID）
- **THEN** 冲突检测排除自身，不因自身而报告冲突

#### Scenario: 覆盖 COMPLETED 事件不冲突
- **WHEN** 创建 PLANNED 事件 09:00-10:00，已存在 COMPLETED 事件在完全相同的时段
- **THEN** 无冲突，正常创建

#### Scenario: 无已有事件不冲突
- **WHEN** 创建事件时，时段内无任何已有事件
- **THEN** 无冲突，正常创建

### Requirement: 事件更新不重新检测冲突
`EventApplicationService.update()` SHALL 先通过 `getById` 做归属校验，然后调用 `existing.update(data)` 部分更新（仅覆盖非 null 字段），再调用 `existing.isValid()` 校验。SHALL NOT 重新执行冲突检测。更新过程中 SHALL 检测状态迁移：原状态非 COMPLETED 且更新后为 COMPLETED 时，SHALL 调用 `grantReward(EVENT_COMPLETED, String.valueOf(eventId))` 发放宠物奖励（幂等，详见 pet-economy-loop）。

#### Scenario: 更新时间不触发冲突检测
- **WHEN** 更新事件 A 的时间，使其与事件 B 重叠
- **THEN** 更新成功，不抛出冲突异常

#### Scenario: 部分更新保留未修改字段
- **WHEN** 更新事件仅修改 title，未修改 startTime/endTime
- **THEN** 其他字段保持不变

#### Scenario: PLANNED 更新为 COMPLETED 触发奖励
- **WHEN** 将 status=PLANNED 的事件更新为 status=COMPLETED
- **THEN** 事件更新成功，宠物获得 +20 专注币 / +30 经验（按 eventId 幂等）

#### Scenario: 再次更新已完成事件不重复发放
- **WHEN** 对已 COMPLETED 的事件再次更新（原状态已为 COMPLETED）
- **THEN** 不触发奖励发放（幂等键命中或未发生状态迁移）

### Requirement: 前端支持 PLANNED ↔ COMPLETED 切换
前端 `useToggleEventStatus` SHALL 将事件状态在 PLANNED 和 COMPLETED 之间切换（不涉及 CANCELLED）。切换 SHALL 通过全量 PUT 请求实现（必须携带 title/startTime/endTime 等全部必填字段）。成功 SHALL 刷新事件列表缓存，toast 提示"已标记完成"或"已恢复为计划中"。

#### Scenario: PLANNED 切换为 COMPLETED
- **WHEN** 对 status=PLANNED 的事件调用 toggle
- **THEN** PUT 请求携带 status=COMPLETED，toast "已标记完成"

#### Scenario: COMPLETED 切换为 PLANNED
- **WHEN** 对 status=COMPLETED 的事件调用 toggle
- **THEN** PUT 请求携带 status=PLANNED，toast "已恢复为计划中"

### Requirement: 查询端点支持按状态和标签过滤
`GET /api/v1/events` SHALL 支持可选 `status` 参数——传入 `PLANNED`/`COMPLETED`/`CANCELLED` 时仅返回匹配状态的事件。SHALL 同时支持可选 `tagId` 参数返回含该标签的事件。两个参数可组合使用。

#### Scenario: 按状态过滤
- **WHEN** `GET /api/v1/events?status=COMPLETED`
- **THEN** 仅返回 status=COMPLETED 的事件

#### Scenario: 状态和标签组合过滤
- **WHEN** `GET /api/v1/events?status=PLANNED&tagId=1`
- **THEN** 返回 status=PLANNED 且含 tag id=1 的事件

