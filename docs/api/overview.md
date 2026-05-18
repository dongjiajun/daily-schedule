# API 规范

基于 `specs/openapi.yaml`，base URL: `/api/v1`

## 认证

所有端点（除 `/auth/**`）需携带 JWT token：

```
Authorization: Bearer <token>
```

Token 通过注册/登录获取。前端自动附加，见 `client.gen.ts`。

## 响应约定

成功响应直接返回业务数据，HTTP 状态码承载语义：

| 场景 | 状态码 | 响应体 |
|------|--------|--------|
| 查询单条 | 200 | `XResponse` 对象 |
| 查询列表 | 200 | `XListResponse` 对象（含 data + total + page + size） |
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

### 认证 Auth

| 方法 | 路径 | 成功响应 | 说明 |
|------|------|---------|------|
| POST | `/auth/register` | 201 `{token, userId, username}` | 注册 |
| POST | `/auth/login` | 200 `{token, userId, username}` | 登录 |

**注册请求示例：**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

默认管理员: admin / admin123

### 日程 Event

| 方法 | 路径 | 成功响应 | 说明 |
|------|------|---------|------|
| GET | `/events?start=&end=&categoryId=&keyword=&page=&size=` | 200 `EventListResponse` | 按时间范围查询（支持搜索+分页） |
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

**查询参数：** `start`(必填)、`end`(必填)、`categoryId`(可选)、`keyword`(可选，搜索标题/描述/地点)、`page`(默认1)、`size`(默认50)

**列表响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [...],
  "total": 42,
  "page": 1,
  "size": 50
}
```

### 分类 Category

| 方法 | 路径 | 成功响应 | 说明 |
|------|------|---------|------|
| GET | `/categories` | 200 `CategoryListResponse` | 获取当前用户所有分类 |
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
| GET | `/tags` | 200 `TagListResponse` | 获取当前用户所有标签 |
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
| GET | `/sse/notifications` | `text/event-stream` | 订阅实时提醒推送（需认证） |

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

前端使用浏览器原生 `EventSource` 订阅，支持断线指数退避自动重连（`useSseNotifications`）。
