# API 契约变更日志

本文件记录 `specs/openapi.yaml` 的所有破坏性、增量与修复型变更，格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)：

- **MAJOR**：破坏性变更（删除端点、修改响应结构、必填字段调整）
- **MINOR**：向后兼容的新增（新端点、新可选字段、新事件）
- **PATCH**：向后兼容的修复（文档勘误、错误响应补全）

---

## [3.5.0] — 2026-08-15

宠物装扮系统（MINOR）：配饰装备语义落地——购买即装备（覆盖旧装备）、取下端点、11 个节日配饰种子。

### Added — 宠物
- `DELETE /pets/me/accessory` — 取下当前配饰（幂等，未装备时同样 204）

### Modified — 商店
- `PurchaseResult` 新增可选字段 `equippedAccessoryId`（装备购买时回传配饰 id，FOOD 购买为 null）——向后兼容
- 购买语义分流：`ACCESSORY` 物品购买即装备（写入 `pets.current_accessory`，quantity 固定 1），`FOOD` 保持即时消费

### Added — 数据库
- `V8__seed_pet_accessories.sql` — 11 个节日配饰种子（年兽皮肤/麋鹿角/巫师帽/玉兔皮肤/粽子背包/新年帽/火鸡帽/绿帽子/樱花发饰/印度象皮肤/兔耳朵），名称与前端 `themeMapping.petAccessory` 对齐

---

## [3.4.0] — 2026-08-14

宠物经济闭环（MINOR）：专注币收入来源落地，任务/日程完成、专注、签到、习惯打卡发放奖励；日程取消产生一次性心情惩罚。

### Added — 宠物
- `POST /pets/me/rewards` — 幂等行为奖励领取（`GrantRewardRequest { source, refId }` → `RewardResult { granted, coinChange, experienceGain, moodChange, newCoins, newExperience, newMood }`）。`granted=false` 表示未发放（无宠物或幂等键已命中），重复请求不重复发放。

### Added — 数据库
- `pet_rewards` 表（V7 迁移）— 奖励发放记录，`UNIQUE (pet_id, source, ref_id)` 幂等键。

---

## [3.3.4] — 2026-08-02

无 API 契约变更（纯前端宠物健壮性收尾：兴趣区保鲜期 15s → 45s + 惰性过期、游走节奏与渲染解耦、SVG transform 格式清理）。版本号随前端发布同步。

---

## [3.3.3] — 2026-08-02

无 API 契约变更（纯前端宠物日程框互动：月视图格子注册 `calendar-cell` Zones，宠物进入格子格内往返走动，当天完成度决定速度/情绪风格）。版本号随前端发布同步。

---

## [3.3.2] — 2026-08-02

无 API 契约变更（纯前端宠物小窝：Sidebar 区域注册 `pet-spot` Zone，宠物游走到小窝自动进窝休息）。版本号随前端发布同步。

---

## [3.3.1] — 2026-08-02

无 API 契约变更（纯前端宠物机制优化：镜像气泡修复、游走 soft 权重化、区域感知机制）。版本号随前端发布同步。

---

## [3.3.0] — 2026-07-22

新增任务看板模块（MINOR），Phase 1 情感核心 M1.5 首个新业务模块。

### Added — 任务
- `GET /tasks` — 按状态/优先级/标签过滤查询当前用户任务列表。
- `POST /tasks` — 创建任务（标题必填，可选描述/优先级/截止日期/标签）。
- `PUT /tasks/{id}` — 更新任务（部分更新语义，支持标签变更）。
- `DELETE /tasks/{id}` — 删除任务（级联删除标签关联）。
- `PATCH /tasks/{id}/move` — 拖拽移动任务到目标状态列。
- 新增 `TaskProfile`、`CreateTaskRequest`、`UpdateTaskRequest`、`MoveTaskRequest` schema。

### Database
- 后端新增 Flyway `V6__create_task_tables.sql`：`tasks`、`task_tags` 两张新表。

### Frontend
- 新增 `modules/todo/` 模块：看板视图（三列拖拽）+ 列表视图（排序/筛选）。
- 宠物模块新增 `task:completed` / `task:created` 事件监听。

---

## [3.2.0] — 2026-07-21

新增宠物养成系统 API（MINOR），Phase 1 情感核心 M1.1 起点。

### Added — 宠物
- 新增 `PetSpecies` schema：`ORANGE_CAT` / `SHIBA_INU`。
- `POST /pets/me` — 创建宠物（选择物种 + 命名），每用户仅限一只。
- `GET /pets/me` — 获取当前用户宠物完整状态。
- `PUT /pets/me` — 更新宠物信息（v1 仅支持改名）。
- `POST /pets/me/interact` — 互动操作（`FEED` 消耗专注币 / `PLAY` 免费）。
- 新增 `PetProfile`、`InteractRequest`、`InteractionResult` schema。

### Added — 商店
- `GET /shop/items` — 获取商店物品列表（v1 仅食物）。
- `POST /shop/purchase` — 购买物品（即时消费模式，效果立即应用）。
- 新增 `ShopItem`、`PurchaseRequest`、`PurchaseResult` schema。

### 数据库
- 后端新增 Flyway `V5__create_pet_tables.sql`：`pets`、`pet_accessories`、`pet_interactions` 三张新表 + 种子数据。

---

## [3.1.0] — 2026-06-09

围绕「日程完成闭环 + 标签过滤」的向后兼容增量（MINOR）。

### Added — Event 状态
- 新增 `EventStatus` schema：`PLANNED`（默认）/ `COMPLETED` / `CANCELLED`。
- `EventCreateRequest` / `EventUpdateRequest` 新增可选 `status` 字段；
  `EventResponse` 返回 `status`。
- 行为约定：`COMPLETED` / `CANCELLED` 的日程**不再触发提醒**，
  也**不参与创建时的时间冲突检测**。

### Added — 查询过滤
- `GET /events` 新增可选 `tagId` 参数：事件含有该标签即命中。
- `GET /events` 新增可选 `status` 参数：按状态过滤。

### 数据库
- 后端新增 Flyway `V4__event_status.sql`：`event` 表加 `status VARCHAR(20) NOT NULL DEFAULT 'PLANNED'`。

---

## [3.0.0] — 2026-06-03

把 v1.1 内部实现的多用户能力对齐到 v3.0 设计文档（`docs/design/multi-user-auth.md`），
**契约层闭环 + 安全收口 + 测试补齐**。

> 版本号说明：v1.1 是上一个 release 的内部代号；从契约 SemVer 视角，
> 多用户认证是 BREAKING（所有端点新增 401），按 SemVer 应升至下一个 MAJOR。
> 跳过 v2.x 直接到 v3.0.0，与设计文档命名一致。

### Added — Auth 端点正式入约
- `POST /auth/register`：注册返回 `LoginResponse`（access + refresh + user）
- `POST /auth/login`：登录返回 `LoginResponse`，同时下发 `dsa_sse_session` Cookie
- `POST /auth/refresh`：用 refresh token 换发新 access token
- `POST /auth/logout`：注销并清除 SSE Cookie
- `GET  /auth/me`：当前用户信息
- 顶层 `security: [bearerAuth]` + `securitySchemes.bearerAuth` JWT 声明
- 全部业务端点声明 `401 Unauthorized`、写场景端点声明 `409 Conflict`
- 新增 `RegisterRequest` / `LoginRequest` / `RefreshRequest` / `LoginResponse` / `UserResponse` schema
- 注册接口要求 `email`、`displayName` 字段（与 v1.1 仅 username/password 不兼容）

### Added — 安全 / 行为收紧
- SSE 鉴权改用 `dsa_sse_session` HttpOnly Cookie（v1.1 是 `?token=` 查询参数，
  会出现在 URL / 日志 / 浏览器历史）；EventSource 自动携带 same-origin cookie。
- 注册流程新增 `email` 与可选 `displayName`；username/email/password 走 `User.validateXxx` 强校验。
- `AuthApplicationService.DuplicateAccountException` → HTTP 409；
  `InvalidCredentialsException` → HTTP 401（取代 v1.1 用 IllegalArgumentException 返回 400 的简陋方案）。
- 移除 `SecurityConfig.ensureDefaultAdmin()`：不再自动创建 admin/admin123 默认账号。
- access token 默认 15min（v1.1 是 24h），新增 refresh token 7d。

### Changed
- `AuthController` 从 `infrastructure/security/` 迁移到 `api/controller/`，
  实现生成的 `AuthApi`，使用 OpenAPI 生成的 DTO 替代 `Map<String, String>` 弱类型。
- 提取 `application/auth/AuthApplicationService`，把业务逻辑从 Controller 解耦；
  提取 `RegisterCommand` / `Tokens` 值对象。
- `JwtUtil` 拆分 access / refresh token，引入 `typ` claim + `parse(token, expectedType)`，
  保留 v1.1 兼容入口 `generateToken` / `validateToken` / `jwt.expiration-ms`。
- `JwtAuthFilter` 支持 Bearer header + `dsa_sse_session` Cookie 两路 token 来源（Bearer 优先）。
- `User` 实体补齐 `email` / `displayName` / `avatarUrl` / `status` / `lastLoginAt` 字段；
  新增静态校验方法 `validateUsername` / `validateEmail` / `validatePassword` / `validateDisplayName`。
- 默认分类预置（工作/个人/学习/健康/社交/旅行）从 Controller 移到 ApplicationService。

### Database (V3 migration)
- `V3__multi_user.sql`：在 V2 创建的 `user` 表基础上补 `email` / `display_name` / `avatar_url` /
  `status` / `last_login_at` 列；建 `(user_id, name)` 唯一约束（category / tag）；
  `event` 索引升级为 `(user_id, start_time, end_time)` 复合索引。
- 旧 admin 账号迁移：补一个占位邮箱 `admin@local` 满足新 NOT NULL + UNIQUE 约束。

### Tests
- 47 个新单测：`UserTest`、`JwtUtilTest`、`JwtAuthFilterTest`、`CurrentUserServiceTest`、
  `PasswordHasherImplTest`、`AuthApplicationServiceTest`。总规模 81 → **128** 用例。

### Frontend
- 重新生成 SDK，含 `register` / `login` / `refreshToken` / `logout` / `currentUser` 客户端。
- `authStore` 持久化结构升级为 `{accessToken, refreshToken, user}`，兼容旧 `auth` localStorage 数据。
- `LoginPage` 切换到 typed SDK，注册增加邮箱字段，登录支持用户名 / 邮箱二选一。
- `useSseNotifications` 移除 `?token=` query 参数，依赖 cookie 自动认证。
- 把 Authorization Bearer 注入逻辑从被覆盖的 `client.gen.ts` 抽离到 `api/authInterceptor.ts`，
  在 `main.tsx` 启动期注册到 hey-api 客户端的 request interceptor 上，规避 SDK 重生覆盖问题。

### Migration（v1.1 → v3.0）

| 关注点 | 行动 |
|--------|------|
| 数据库 | 应用 `V3__multi_user.sql`（仅 ALTER，不会丢数据；admin 用户邮箱自动写为 `admin@local`） |
| `JWT_SECRET` | 生产必须配置 ≥ 256bit 密钥；新增 `jwt.access-ttl-seconds` / `jwt.refresh-ttl-seconds`；保留旧 `jwt.expiration-ms` 兼容 |
| 客户端 | 重新生成 SDK；`auth/login` body 字段从 `{username, password}` 改为 `{usernameOrEmail, password}`；响应字段从 `{token, userId, username}` 改为 `{accessToken, refreshToken, expiresIn, user}` |
| SSE | 客户端不再传 `?token=`；浏览器自动携带 `dsa_sse_session` Cookie |
| 用户行为 | 注册需提供邮箱；旧 admin/admin123 仍可登录但不再被自动创建 |

---

## [2.0.0] — 2026-05-15（合并到 main 前的早期"v2"标记，未独立发布）

> 此版本作为 changelog 历史记录保留，对应 `pom.xml 2.0.0-SNAPSHOT` 时期；
> 真正向公网发布的是 v3.0.0。

- 列表端点改为直接返回数组；错误响应统一为 `ApiResponse`
- SSE `/sse/notifications` 纳入 OpenAPI 契约
- shadcn/ui 组件补全；后端测试覆盖扩展到 81 例

---

## [1.0.0] — 2026 v1.0 首发

### Added
- Event / Category / Tag 三组核心资源的 CRUD 端点
- `{code, message, data}` 包装响应结构
- `EventListResponse` / `CategoryListResponse` / `TagListResponse` 包装 schema
- SSE 通知端点 `GET /sse/notifications`（`connect` / `reminder` / `heartbeat` 事件）
- `ReminderEvent` schema

### Migration 建议（从 v1.0 → v1.1）
- 前端: 需新增登录/注册页面，API 调用自动附加 JWT token
- 后端: 数据库需执行 `V2__add_user_support.sql` Flyway 迁移
- 默认用户: admin / admin123
