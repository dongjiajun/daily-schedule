# API 规范

> **唯一真相源**: `specs/openapi.yaml`  
> **当前 API 版本**: 3.3.4  
> **变更历史**: `specs/CHANGELOG.md`  
> 本文档提供叙事性说明与使用示例；Schema 细节与端点定义以 OpenAPI 文件为准。

Base URL: `/api/v1`

## 认证

所有端点（除 `/auth/register`、`/auth/login`、`/auth/refresh`、`/sse/notifications`）需携带 JWT：

```
Authorization: Bearer <accessToken>
```

Token 通过注册/登录获取，access token 有效期 15 分钟，refresh token 有效期 7 天。前端 `authInterceptor.ts` 自动注入 Bearer 并在过期前 30 秒静默续签。

### 认证端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/register` | 注册（需 username + email + password，可选 displayName），返回 `LoginResponse` |
| POST | `/auth/login` | 登录（usernameOrEmail + password），返回 `LoginResponse` 并下发 `dsa_sse_session` Cookie |
| POST | `/auth/refresh` | 用 refresh token 续签，返回新的 `LoginResponse` |
| POST | `/auth/logout` | 注销（清除 SSE Cookie），返回 204 |
| GET | `/auth/me` | 获取当前用户信息 `UserResponse` |

**LoginResponse 结构**：

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 900,
  "user": { "id": 1, "username": "admin", "email": "admin@local", "displayName": "管理员" }
}
```

**注册请求示例**：

```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "password123",
  "displayName": "张三"
}
```

**登录请求示例**（支持用户名或邮箱二选一）：

```json
{
  "usernameOrEmail": "admin",
  "password": "admin123"
}
```

## 响应约定

成功响应直接返回业务数据，HTTP 状态码承载语义：

| 场景 | 状态码 | 响应体 |
|------|--------|--------|
| 查询单条 | 200 | 对象（如 `EventResponse`、`CategoryResponse`） |
| 查询列表 | 200 | 数组（无需解包，直接 `T[]`） |
| 创建成功 | 201 | 创建后的对象 |
| 更新成功 | 200 | 更新后的对象 |
| 删除成功 | 204 | 无响应体 |
| 参数错误 | 400 | `ApiResponse { code, message }` |
| 未认证/Token 失效 | 401 | `ApiResponse` |
| 无权访问 | 403 | `ApiResponse` |
| 资源不存在 | 404 | `ApiResponse` |
| 资源冲突（重名等） | 409 | `ApiResponse` |
| 服务端错误 | 500 | `ApiResponse` |

错误响应示例：

```json
{ "code": 409, "message": "该时段已有其他日程，请调整时间" }
```

## 日程 Event

### 查询 `GET /events`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | datetime | **是** | 查询起始时间 |
| end | datetime | **是** | 查询结束时间 |
| categoryId | int | 否 | 按分类过滤 |
| tagId | int | 否 | 按标签过滤（v3.1 新增） |
| status | string | 否 | 按状态过滤：`PLANNED` / `COMPLETED` / `CANCELLED`（v3.1 新增） |
| keyword | string | 否 | 搜索标题、描述、地点 |
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页条数，默认 50 |

返回 `EventResponse[]` 数组，每个含完整 `tags`（name + color）、`categoryName`、`categoryColor`。

### 创建 `POST /events`

```json
{
  "title": "团队周会",
  "startTime": "2026-07-02T09:00:00",
  "endTime": "2026-07-02T10:00:00",
  "allDay": false,
  "location": "3F 会议室",
  "color": "#1890ff",
  "reminderMinutes": 15,
  "status": "PLANNED",
  "categoryId": 1,
  "tagIds": [1, 2]
}
```

创建时自动检测时间冲突（相同用户、时间重叠的 PLANNED 事件）。已完成的日程（COMPLETED / CANCELLED）不参与冲突检测，也不触发提醒。

### 更新 `PUT /events/{id}`

与创建相同的请求体，支持修改所有字段。拖拽日历或拉伸时长时前端调用此接口。

### 其他端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/events/{id}` | 查询单个日程 |
| DELETE | `/events/{id}` | 删除日程（204） |

## 分类 Category

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/categories` | 获取当前用户所有分类，返回数组 |
| POST | `/categories` | 创建（需 name，可选 color + description），201 |
| PUT | `/categories/{id}` | 更新，200 |
| DELETE | `/categories/{id}` | 删除，204 |

- 用户内分类名唯一（v3.0+ 施加 `UNIQUE(user_id, name)`）
- 创建/更新同名返回 409
- 列表结果有 Caffeine 缓存（5 分钟），写操作自动驱逐

## 标签 Tag

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tags` | 获取当前用户所有标签，返回数组 |
| POST | `/tags` | 创建（需 name，可选 color），201 |
| PUT | `/tags/{id}` | 更新，200 |
| DELETE | `/tags/{id}` | 删除，204 |

与 Category 相同：用户内名称唯一，有 Caffeine 缓存，写操作驱逐。

## 通知 Notification（SSE）

```
GET /api/v1/sse/notifications
```

**鉴权方式**：通过登录时下发的 `dsa_sse_session` HttpOnly Cookie（浏览器 EventSource 不支持自定义 header，故不复用 Bearer）。

**推送的命名事件**：

| 事件名 | data | 说明 |
|--------|------|------|
| `connect` | `"connected"` | 连接建立成功 |
| `reminder` | `ReminderEvent` JSON | 日程提醒（仅推送给该 event 所属用户） |
| `heartbeat` | `"ping"` | 30 秒心跳保活 |

**ReminderEvent 结构**：

```json
{
  "id": 1,
  "title": "团队周会",
  "startTime": "2026-07-02T09:00:00",
  "reminderMinutes": 15
}
```

**提醒触发逻辑**（后端 `ReminderScheduler`，30 秒轮询）：

1. 查询未来 1 小时内设有 `reminderMinutes` 的 PLANNED 日程
2. 当前时间距 `startTime - reminderMinutes` 在 ±30 秒窗口内触发
3. 写入 `last_reminded_at` 实现幂等（同一次提醒不重复推送）
4. COMPLETED / CANCELLED 日程**不触发**提醒

**前端重连**：`useSseNotifications` hook 负责连接管理，断开后指数退避自动重连。v3.0+ 不再使用 `?token=` 查询参数，依赖 Cookie 自动认证。

## 宠物 Pet（v3.2 新增）

### 创建宠物 `POST /pets/me`

```json
// Request
{ "species": "ORANGE_CAT", "name": "大橘" }
// Response 201
{ "id": 1, "species": "ORANGE_CAT", "name": "大橘", "mood": 100, "hunger": 100, "coins": 100, "level": 1, "experience": 0 }
```

- 每用户仅限一只宠物，重复创建返回 409
- species: `ORANGE_CAT` | `SHIBA_INU`

### 查看宠物 `GET /pets/me`

返回完整 PetProfile（id / species / name / experience / level / mood / hunger / coins / currentAccessory / lastInteractedAt / createdAt）。无宠物时返回 404。

### 更新宠物 `PUT /pets/me`

v1 仅支持改名：`{ "name": "二橘" }`

### 互动 `POST /pets/me/interact`

```json
// Request - 喂食
{ "type": "FEED", "itemId": 1, "quantity": 1 }
// Request - 玩耍
{ "type": "PLAY", "quantity": 1 }
// Response
{ "moodChange": 25, "hungerChange": -10, "experienceGain": 15, "coinChange": 0, "newMood": 95, "newHunger": 70, "newExperience": 15, "newCoins": 100 }
```

- FEED 需指定 `itemId`（商品 ID），不指定则默认最便宜食物。专注币不足时返回 400。
- PLAY 免费，不消耗专注币

## 商店 Shop（v3.2 新增）

### 物品列表 `GET /shop/items`

返回 ShopItem 数组：`[{ "id": 1, "name": "小鱼干", "type": "FOOD", "price": 10, "effectMood": 5, "effectHunger": 20, "effectExperience": 3 }, ...]`

### 购买 `POST /shop/purchase`

```json
// Request
{ "itemId": 1, "quantity": 2 }
// Response
{ "success": true, "itemName": "小鱼干", "quantity": 2, "totalCost": 20, "newCoins": 80, "newMood": 90, "newHunger": 100, "newExperience": 6 }
```

- v1 即时消费模式：购买即使用，效果立即应用到宠物
- 专注币不足返回 400

## 任务 Task（v3.3 新增）

### 查询任务 `GET /tasks`

支持按状态/优先级/标签过滤，返回当前用户任务列表。

```
GET /api/v1/tasks?status=TODO&priority=HIGH&tagId=1
```

### 创建任务 `POST /tasks`

```json
// Request
{ "title": "买水果", "priority": "HIGH", "dueDate": "2026-07-25", "tagIds": [1, 2] }
// Response 201
{ "id": 1, "title": "买水果", "status": "TODO", "priority": "HIGH", "dueDate": "2026-07-25", "sortOrder": 1, "tags": [...], "createdAt": "..." }
```

- 仅标题必填，其余字段均可选
- 默认 status=TODO，priority=MEDIUM

### 更新任务 `PUT /tasks/{id}`

部分更新语义：仅更新请求中提供的字段。

### 删除任务 `DELETE /tasks/{id}`

级联删除 task_tags 关联，返回 204。

### 移动任务 `PATCH /tasks/{id}/move`

```json
// Request
{ "status": "IN_PROGRESS", "sortOrder": 3 }
```

- 拖拽看板卡片时调用，变更任务状态和排序位置
- status 为 TODO / IN_PROGRESS / DONE 之一
