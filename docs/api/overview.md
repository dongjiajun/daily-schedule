# API 规范

基于 `specs/openapi.yaml`，base URL: `/api/v1`

## 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": [...]
}
```

## 端点清单

### 日程 Event

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/events?start=&end=&categoryId=` | 按时间范围查询 |
| POST | `/events` | 创建日程 |
| GET | `/events/{id}` | 查询单个 |
| PUT | `/events/{id}` | 更新日程 |
| DELETE | `/events/{id}` | 删除日程 |

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

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/categories` | 获取所有分类 |
| POST | `/categories` | 创建分类 |
| PUT | `/categories/{id}` | 更新分类 |
| DELETE | `/categories/{id}` | 删除分类 |

**创建请求示例：**
```json
{
  "name": "工作",
  "color": "#1890ff",
  "description": "工作相关日程"
}
```

### 标签 Tag

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tags` | 获取所有标签 |
| POST | `/tags` | 创建标签 |
| PUT | `/tags/{id}` | 更新标签 |
| DELETE | `/tags/{id}` | 删除标签 |

**创建请求示例：**
```json
{
  "name": "高优先级",
  "color": "#f5222d"
}
```

### SSE 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/sse/notifications` | 订阅实时提醒推送 |
