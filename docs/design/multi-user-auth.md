# 多用户登录设计

> **状态**：设计已确认，实现待落地（计划 v3.0.0）。
> **范围**：仅本文档覆盖设计意图、契约影响、数据库迁移、前后端落地路径与风险评估，不在本 PR 中实施。

## 1. 设计目标

- 从单用户隐式模型升级为显式多用户，每个用户的 `event` / `category` / `tag` 数据彼此完全隔离。
- 引入"用户身份"作为唯一一等公民概念；其余领域模型通过 `user_id` 外键归属。
- 认证方式：**JWT (HS256) + Refresh Token**，无状态、易于多实例水平扩展，不依赖服务端 session。
- 兼顾 SSE 通道：`/api/v1/sse/notifications` 需要在长连接建立时认证并按用户隔离推送。

### 非目标（明确不做）

- 多租户（tenant 隔离）—— 暂不考虑组织/团队层级。
- 第三方 OAuth 登录 —— 后续 v3.x 再加。
- 细粒度权限（RBAC / ABAC）—— 仅区分"已登录用户访问自己的数据"。
- 端到端加密 / 客户端密钥管理。

## 2. 数据库设计

### 2.1 新增 `user` 表

```sql
CREATE TABLE `user` (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL,
    email           VARCHAR(120) NOT NULL,
    password_hash   VARCHAR(100) NOT NULL,      -- BCrypt 60 字符 + 余量
    display_name    VARCHAR(50),
    avatar_url      VARCHAR(255),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
                                                 -- ACTIVE / DISABLED / DELETED
    last_login_at   DATETIME,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                              ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_username (username),
    UNIQUE KEY uk_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 业务表加 `user_id`

| 表 | 新增列 | 约束变化 |
|----|--------|----------|
| `event` | `user_id BIGINT NOT NULL` | + FK → `user.id` ON DELETE CASCADE；索引 `(user_id, start_time, end_time)` 替换原 `(start_time, end_time)` |
| `category` | `user_id BIGINT NOT NULL` | + FK → `user.id` ON DELETE CASCADE；唯一约束改为 `(user_id, name)` 而非全局 `name` |
| `tag` | `user_id BIGINT NOT NULL` | + FK → `user.id` ON DELETE CASCADE；唯一约束 `(user_id, name)` |

> `event_tag` 不需要 `user_id`：通过 `event.user_id` 隐式归属。

### 2.3 迁移策略 — `V3__multi_user.sql`

向后**不**兼容（破坏性变更，配合 OpenAPI 升 v3.0.0）。迁移流程：

1. 创建 `user` 表，写入一条 `system` 用户（`id=1`，username=`legacy`，标记 `status='SYSTEM'`），将所有现存数据归属给该用户。
2. 对 `event` / `category` / `tag` 添加 `user_id` 列，默认值 `1`，写入完成后改为 `NOT NULL`。
3. 删除旧索引 `category.uk_category_name`（如有）；建立 `(user_id, name)` 唯一索引。
4. 重建 `event` 索引：`(user_id, start_time, end_time)`、`(user_id, category_id)`。
5. 添加外键约束。

**回滚**：保留 V2 之前的 schema 快照（`db/migration/snapshots/V1_schema.sql`），出现严重问题时 dump 数据后回退。

## 3. 后端架构改动

### 3.1 领域层

新增 `domain/user/`：

```
domain/user/
├── User.java                   // 实体，包含 verifyPassword(rawPassword, hasher) 等业务方法
├── UserStatus.java             // 枚举 ACTIVE / DISABLED / DELETED / SYSTEM
├── UserRepository.java         // 仓储接口
└── PasswordHasher.java         // 端口：抽象密码哈希（infrastructure 实现 BCrypt）
```

`Event` / `Category` / `Tag` 实体新增 `userId` 字段。**不**新增 `User` 对象引用，保持值对象边界清晰。

### 3.2 应用层

新增 `application/auth/AuthApplicationService`：

```java
public class AuthApplicationService {
    Tokens login(String usernameOrEmail, String rawPassword);   // 验签 + 签发
    User register(RegisterCommand cmd);                          // 唯一性校验 + 创建
    Tokens refresh(String refreshToken);                         // 校验 refresh + 重签
    void logout(Long userId, String refreshTokenJti);            // 黑名单（Redis 或 DB 表）
}
```

`EventApplicationService` / `CategoryApplicationService` / `TagApplicationService` 全部签名增加 `Long userId` 参数：

```java
List<Event> listByRange(Long userId, LocalDateTime start, LocalDateTime end, Long categoryId);
Event create(Long userId, Event event);
Event update(Long userId, Long id, Event data);    // 内部断言 event.userId == userId
```

### 3.3 基础设施层

- `infrastructure/security/`：
  - `JwtService` — 签发、校验、解析
  - `PasswordHasherImpl` — `BCryptPasswordEncoder` 包装
  - `JwtAuthenticationFilter extends OncePerRequestFilter` — 解析 `Authorization: Bearer <token>` 注入 `SecurityContext`
  - `SecurityConfig` — Spring Security 6 函数式配置；`/api/v1/auth/**` 与 `/api/v1/sse/notifications` 的认证策略
- `infrastructure/persistence/`：
  - `UserMapper` / `UserPO` / `UserRepositoryImpl`
  - 所有现有 mapper 的 `@Select` 加上 `WHERE user_id = #{userId}`

### 3.4 API 层

新增 `api/controller/AuthController`，对应 OpenAPI 端点：

| 方法 | 路径 | 说明 | 响应 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 注册 | 201 `UserResponse` |
| POST | `/api/v1/auth/login` | 登录 | 200 `LoginResponse { accessToken, refreshToken, expiresIn, user }` |
| POST | `/api/v1/auth/refresh` | 刷新 token | 200 `LoginResponse` |
| POST | `/api/v1/auth/logout` | 注销当前 refresh | 204 |
| GET | `/api/v1/auth/me` | 当前用户信息 | 200 `UserResponse` |

`CurrentUser` 参数解析器（`@AuthenticationPrincipal` 或自定义注解 `@CurrentUserId Long userId`）注入到所有受保护的 Controller 方法。

### 3.5 错误码

| HTTP | 业务码 | 含义 |
|------|--------|------|
| 401 | 40101 | 未认证或 token 失效 |
| 401 | 40102 | refresh token 失效 |
| 403 | 40301 | 无权访问其他用户资源 |
| 409 | 40901 | 用户名 / email 已被占用 |
| 422 | 42201 | 密码强度不足（最少 8 位、含字母数字） |

## 4. SSE 通道的多用户改造

挑战：浏览器 `EventSource` **不支持自定义请求头**，无法直接发送 `Authorization`。

方案选型：

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| 短期 token query 参数：`?token=xxx` | 实现简单 | token 出现在 URL / 日志 | ❌ 不安全 |
| HttpOnly Cookie | 自动随请求发送 | 跨域时需 SameSite=None+Secure | ✅ 用于 SSE |
| Polyfill 库（如 `event-source-polyfill`）支持自定义 header | 复用 Bearer 体系 | 增加前端依赖体积 | 备选 |

**采用 Cookie 方案**：登录时同时下发：
- `Authorization: Bearer <jwt>` 走 Header（XHR / fetch 用）
- `Set-Cookie: dsa_session=<short_jwt>; HttpOnly; SameSite=Lax`（仅供 SSE 端点用，短有效期 1h）

`SseEmitterManager` 由 `CopyOnWriteArrayList<SseEmitter>` 改造为 `ConcurrentHashMap<Long userId, List<SseEmitter>>`，`sendToAll` 改为 `sendToUser(userId, event)`，由 `BrowserNotificationService` 根据 `event.userId` 路由。

## 5. 前端改动

### 5.1 新增

- `src/pages/{LoginPage, RegisterPage}.tsx` —— 登录 / 注册页面（shadcn 表单组件）
- `src/store/authStore.ts` —— Zustand 持久化（`localStorage` 持久化 `accessToken` + 内存持 `refreshToken`）
- `src/lib/authFetch.ts` —— `fetch` 拦截器：
  - 请求阶段注入 `Authorization` 头
  - 响应 401 时尝试用 refresh token 续签，重放原请求；二次 401 → 跳转登录
- `src/components/layout/ProtectedRoute.tsx` —— `<Route>` 包装，未登录跳转 `/login`
- `src/components/layout/UserMenu.tsx` —— Sidebar 顶部用户头像 + 注销

### 5.2 修改

- `App.tsx`：路由树新增 `/login`、`/register`；其余路由由 `ProtectedRoute` 包裹
- `api/client.gen.ts`：通过 `createClient` 注入 `authFetch` 作为底层 `fetch` 实现
- `useSseNotifications.ts`：保持 EventSource，依赖后端 Cookie 自动鉴权
- 移除"侧栏全部分类不区分用户"的假设；改为 React Query 缓存 key 加入用户 id

### 5.3 体验细节

- 登录后默认重定向至原本意图访问的页面（`?redirect=` 查询参数）
- 注册成功后**自动登录**，无需二次输入
- Token 即将过期（剩余 < 60s）时静默刷新

## 6. OpenAPI 契约改动概要（计划 v3.0.0）

```yaml
paths:
  /auth/register:
    post: ...
  /auth/login:
    post: ...
  /auth/refresh:
    post: ...
  /auth/logout:
    post: ...
  /auth/me:
    get: ...

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []   # 全局生效

# /auth/login、/auth/register 等单点 override 为 security: []
```

所有现有业务端点保持 URI 不变，但全部声明 `security: [bearerAuth]`；响应新增 `401`。

## 7. 实施分期

| 阶段 | 目标 | 提交粒度 |
|------|------|----------|
| **Phase 1 — Schema & Domain** | V2 迁移、`User` 实体、Repository、密码哈希 port | 1 PR |
| **Phase 2 — Auth API** | `AuthApplicationService`、`AuthController`、JWT、Security 配置、契约更新 | 1 PR |
| **Phase 3 — 业务层接入** | 给所有 Application Service 加 `userId` 参数 + Mapper SQL 改造 + 测试改造 | 1 PR |
| **Phase 4 — SSE 多用户** | `SseEmitterManager` 按 userId 路由 + Cookie 鉴权 + `BrowserNotificationService` 改造 | 1 PR |
| **Phase 5 — 前端落地** | 登录页 / 注册页 / authStore / ProtectedRoute / fetch 拦截器 | 1 PR |
| **Phase 6 — 加固** | Refresh token 黑名单（Redis）、限流、强密码、邮箱验证（可选） | 1 PR |

## 8. 风险与权衡

| 风险 | 缓解 |
|------|------|
| 现存单用户数据迁移失败 | V2 迁移先在 staging 验证；保留快照；将所有现存数据归属 `legacy` 系统用户 |
| JWT 撤销难度（无状态） | refresh token 用短有效期（7d）+ DB/Redis 黑名单；access token 短有效期（15min） |
| 密码泄露 | BCrypt cost=12（约 250ms/hash）；登录限流（5次/分钟/IP） |
| SSE Cookie 跨站攻击 | Cookie `SameSite=Lax` + `HttpOnly` + `Secure`（生产强制 HTTPS） |
| 多实例部署下 SSE 连接亲和 | 引入 Redis Pub/Sub 把通知广播到所有实例后按 userId 局部投递 |
| 前端兼容旧本地缓存 | `authStore.version` 字段 + 版本不匹配清空 |

## 9. 依赖项追加

### 后端 `pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

### 前端 `package.json`

不新增依赖；登录表单基于现有 shadcn 组件实现。

## 10. 配置项

新增环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `JWT_SECRET` | — | HS256 密钥（≥ 256 bit） |
| `JWT_ACCESS_TTL_SECONDS` | `900` | access token 有效期（默认 15min） |
| `JWT_REFRESH_TTL_SECONDS` | `604800` | refresh token 有效期（默认 7d） |
| `AUTH_LOGIN_RATE_LIMIT` | `5/min` | 登录限流配置 |

应同步更新 `.env.example` 与 `application-prod.yml`。

---

## 附录 A：登录时序

```
Client                          /auth/login           AuthApp           UserRepo      JwtSvc
  │  POST {username, password}    │                     │                  │            │
  │ ─────────────────────────────>│                     │                  │            │
  │                               │  login(u,p)         │                  │            │
  │                               │ ───────────────────>│                  │            │
  │                               │                     │ findByUsername() │            │
  │                               │                     │ ────────────────>│            │
  │                               │                     │ <────────────────│            │
  │                               │ verify(BCrypt)      │                  │            │
  │                               │                     │                  │            │
  │                               │ issue access+refresh│ ────────────────────────────>│
  │                               │ <────────────────────────────────────────────────── │
  │ <─────────── 200 LoginResponse│                     │                  │            │
  │   + Set-Cookie: dsa_session   │                     │                  │            │
```

## 附录 B：受保护接口时序

```
Client      JwtFilter         SecurityContext       Controller        AppService
  │ Authorization: Bearer <jwt>     │                     │                │
  │ ─────────>│                     │                     │                │
  │           │ parse + verify      │                     │                │
  │           │ ────────────────────>│ setAuthentication  │                │
  │           │ chain                │                     │                │
  │           │ ─────────────────────────────────────────>│ @CurrentUserId │
  │           │                     │                     │ ──────────────>│
  │           │                     │                     │  business      │
  │ <──────── 200 ─────────────────────────────────────── │                │
```
