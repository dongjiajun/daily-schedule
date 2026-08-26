# Proposal: 微信小程序登录（wechat-auth）

## Why

小程序骨架（miniprogram-foundation）已就位并完成真实 appid 导入验证，但小程序端尚无登录能力，无法访问 `/api/v1/**` 业务数据——小程序第一个业务变更必须是认证。微信平台的标准登录路径是 `wx.login`（code 换 openid）静默免密登录，与 Web 端用户名密码注册/登录并存。

## What Changes

- Flyway V9 迁移：`user` 表加 `openid` 列（可空、UNIQUE、带索引）——Web 老用户无 openid，微信新用户自动开户
- 新增 `POST /api/v1/auth/wechat-login` 端点：小程序 `wx.login` 的 code → 后端调微信 `jscode2session` 换取 openid → 已有 openid 则登录、无则静默注册 → 返回 JWT（access + refresh，与现有 `/auth/login` 响应结构一致）
- 领域层 `User` 实体补 `openid` 字段；应用层新增 `WechatLoginCommand` + 登录/注册分流逻辑
- 基础设施层新增微信 API 客户端（jscode2session 调用，restTemplate/WebClient）
- 前端 SDK 同步生成（`npm run generate:api`）；小程序 pages/index 接入登录状态展示（骨架级，完整业务页后续变更做）

## Capabilities

### New Capabilities

- `wechat-auth`: 微信小程序登录——wx.login code 换 openid、免密登录/静默注册、JWT 会话与 Web 端共用

### Modified Capabilities

- （无）

## API Contract Impact

- 修改 `specs/openapi.yaml`：新增 `POST /api/v1/auth/wechat-login`（请求 `{ code }`，响应与 `/auth/login` 同构 `{ accessToken, refreshToken, user }`）
- 新增 DTO：`WechatLoginRequest` / `WechatLoginResponse`
- 非 BREAKING（纯新增端点，现有端点不动）
- 同步 `specs/CHANGELOG.md` + 三处版本号（openapi.yaml / pom.xml / package.json）

## DDD Layer Impact

- **API 层**：`AuthController` 实现生成的 wechatLogin 接口方法；`AuthAssembler` 补 wechat 响应组装
- **应用层**：`AuthApplicationService` 新增 `wechatLogin(WechatLoginCommand)`（code 校验 → openid 解析 → 按 openid 查用户 → 分流登录/注册 → 签发 JWT）
- **领域层**：`User` 实体补 `openid` 字段；`UserRepository` 补 `findByOpenid`
- **基础设施层**：新增 `WechatClient`（调用微信 jscode2session）；`UserRepositoryImpl` 补 openid 查询；`application.yml` 加 `wechat.app-id` / `wechat.app-secret` 配置项（环境变量注入，不落仓库明文）

## Database Impact

- 新 Flyway 迁移 `V9__add_user_openid.sql`：`ALTER TABLE user ADD COLUMN openid VARCHAR(64) NULL` + `UNIQUE KEY uk_user_openid (openid)` + 索引（可空列 UNIQUE 允许多个 NULL，MySQL 语义满足"Web 老用户无 openid"）
- H2 测试 schema `schema-h2.sql` 同步补列

## Impact

- 后端：`backend/`（auth 链路 + 微信客户端 + 配置 + 迁移）
- 前端 SDK：`frontend/src/api/`（generate:api 自动，无手写逻辑变更）
- 小程序：`apps/miniprogram/src/pages/index/`（登录态骨架展示，验证 code→JWT 链路）
- 测试：后端 auth 测试扩展（wechatLogin 用例：新用户静默注册 / 老用户再登录 / 微信 API 失败映射）；小程序共享测试如需
- 文档：`docs/api/overview.md`（新端点）+ `docs/database/schema.md`（user.openid）+ `docs/architecture.md`（认证章节补微信登录）+ CLAUDE.md 版本声明
- 依赖：后端新增 HTTP 客户端（复用 Spring Boot 内置 RestClient，无新依赖即可）
