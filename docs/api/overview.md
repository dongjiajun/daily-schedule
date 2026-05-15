# API 规范

基于 `specs/openapi.yaml`，base URL: `/api/v1`

## 响应约定

成功响应直接返回业务数据，HTTP 状态码承载语义：

| 场景 | 状态码 | 响应体 |
|------|--------|--------|
| 查询单条 | 200 | `XResponse` 对象 |
| 查询列表 | 200 | `XResponse[]` 数组 |
| 创建成功 | 201 | `XResponse` 对象 |
| 更新成功 | 200 | `XResponse` 对象 |
| 删除成功 | 204 | 无响应体 |
| 参数错误 | 400 | `ApiResponse` |
| 资源不存在 | 404 | `ApiResponse` |
| 服务端错误 | 500 | `ApiResponse` |

错误响应统一为 `ApiResponse`：

```json
{
  "code": 400,
  "message": "该时段已有其他日程，请调整时间"
}
```

## 端点清单

### 日程 Event

| 方法 | 路径 | 成功响应 | 说明 |
|------|------|---------|------|
| GET | `/events?start=&end=&categoryId=` | 200 `EventResponse[]` | 按时间范围查询 |
| POST | `/events` | 201 `EventResponse` | 创建日程 |
| GET | `/events/{id}` | 200 `EventResponse` | 查询单个 |
| PUT | `/events/{id}` | 200 `EventResponse` | 更新日程 |
| DELETE | `/events/{id}` | 204 | 删除日程 |

**创建请求示例：**
```json
{
  "title": "团队周会",
  "startTime": "2026-05-10T09:00:00",
  "endTime": "2026-05-10T10:00:00",
  "allDay": false,
  "location": "3F 会议室",
  "color": "#1890ff",
  "reminderMinutes": 15,
  "categoryId": 1,
  "tagIds": [1, 2]
}
```

**查询参数：** `start`(必填)、`end`(必填)、`categoryId`(可选)

### 分类 Category

| 方法 | 路径 | 成功响应 | 说明 |
|------|------|---------|------|
| GET | `/categories` | 200 `CategoryResponse[]` | 获取所有分类 |
| POST | `/categories` | 201 `CategoryResponse` | 创建分类 |
| PUT | `/categories/{id}` | 200 `CategoryResponse` | 更新分类 |
| DELETE | `/categories/{id}` | 204 | 删除分类 |

**创建请求示例：**
```json
{
  "name": "工作",
  "color": "#1890ff",
  "description": "工作相关日程"
}
```

### 标签 Tag

| 方法 | 路径 | 成功响应 | 说明 |
|------|------|---------|------|
| GET | `/tags` | 200 `TagResponse[]` | 获取所有标签 |
| POST | `/tags` | 201 `TagResponse` | 创建标签 |
| PUT | `/tags/{id}` | 200 `TagResponse` | 更新标签 |
| DELETE | `/tags/{id}` | 204 | 删除标签 |

**创建请求示例：**
```json
{
  "name": "高优先级",
  "color": "#f5222d"
}
```

### 通知 Notification（SSE）

| 方法 | 路径 | Content-Type | 说明 |
|------|------|--------------|------|
| GET | `/sse/notifications` | `text/event-stream` | 订阅实时提醒推送 |

服务端推送以下命名事件：

| 事件名 | data 内容 | 说明 |
|--------|-----------|------|
| `connect` | `"connected"` | 连接建立成功 |
| `reminder` | `ReminderEvent` 的 JSON 字符串 | 日程提醒 |
| `heartbeat` | `"ping"` | 心跳保活 |

**`ReminderEvent` 结构：**
```json
{
  "id": 1,
  "title": "团队周会",
  "startTime": "2026-05-10T09:00:00",
  "reminderMinutes": 15
}
```

前端使用浏览器原生 `EventSource` 订阅并通过 `addEventListener('reminder', handler)` 监听。
