# Tasks: 微信小程序登录（wechat-auth）

<!--
  按 DDD 分层编排，每个任务 - [ ] X.Y 格式，apply 阶段据此追踪进度。

  ⚠️ 测试边界提醒：
  涉及以下技术时，单元测试 mock 无法覆盖真实浏览器行为，
  MUST 在 9.4 smoke test 中手工验证：
    - 微信 jscode2session 真实调用（需真实 appid/secret）
    - 小程序 wx.login 运行时行为
-->

## 1. 数据库迁移
- [x] 1.1 编写 `V9__add_user_openid.sql`：`user` 表加 `openid VARCHAR(64) NULL`（AFTER id）+ `UNIQUE KEY uk_user_openid (openid)`
- [x] 1.1.1（smoke test 发现追加）编写 `V10__make_user_email_nullable.sql`：`user.email` 改 `NULL` 可空——微信静默注册无邮箱，MySQL `NOT NULL` 无默认值导致 insert 失败（H2 测试表无 email 列故测试未暴露）
- [x] 1.2 更新 H2 测试 schema `schema-h2.sql`：user 表 DDL 同步补 openid 列与唯一约束
- [x] 1.3 启动 local MySQL 验证 Flyway V9 迁移成功（`docker-compose up -d` + 启动 dev profile 观察 schema 版本）

## 2. 领域层 (domain/)
- [x] 2.1 `User` 实体加 `openid` 字段 + getter/setter
- [x] 2.2 `UserRepository` 接口加 `Optional<User> findByOpenid(String openid)`

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 persistence：`UserPO` 补 `openid` 字段 + `UserMapper` 按 openid 查询 + `UserRepositoryImpl` 实现 `findByOpenid`（UserPO→User 转换补 openid）
- [x] 3.2 新增 `infrastructure/wechat/` 包：`WechatAuthPort` 接口（应用层依赖方向）+ `WechatClient`（RestClient 调 jscode2session，errcode 40029 与其余错误区分抛 `WechatApiException(errcode)`，日志不落 code/secret）+ `WechatApiException`
- [x] 3.3 `application.yml` 加 `wechat.app-id: ${WECHAT_APP_ID:}` / `wechat.app-secret: ${WECHAT_APP_SECRET:}` 占位符
- [x] 3.4 编写 infrastructure 层单元测试（WechatClient mock 微信响应：成功解析 openid / 40029 / 其他 errcode / 网络异常）

## 4. 应用层 (application/)
- [x] 4.1 `AuthApplicationService.wechatLogin(WechatLoginCommand)`：code 空校验 → resolveOpenId → findByOpenid 分流（命中登录 / 未命中注册：`wx_` 前缀 username + 随机 BCrypt 哈希 + seedDefaultCategories）→ issueTokens；新增 record `WechatLoginCommand`
- [x] 4.2 编写应用层单元测试：首次登录静默注册（username 规则/密码不可登录/默认分类种子）/ 再次登录命中同一用户 / code 空校验 / WechatApiException 上抛映射

## 5. API 层 (api/)
- [x] 5.1 `AuthController` 实现生成的 `wechatLogin` 接口方法；抽取 `toLoginResponse(Tokens)` 供 login/wechatLogin 共用
- [x] 5.2 `GlobalExceptionHandler` 加 `WechatApiException` 映射：errcode 40029 → 400，其余 → 502
- [x] 5.3 编写 API 层单元测试（Controller wechatLogin 200/400/502 + GlobalExceptionHandler 新增映射用例）

## 6. 契约同步
- [x] 6.1 更新 `specs/openapi.yaml`：新增 `/auth/wechat-login`（operationId wechatLogin，security: []）+ `WechatLoginRequest { code: string required }` + `502` response 条目；响应复用 `LoginResponse`
- [x] 6.2 更新 `specs/CHANGELOG.md`（新增端点记录）
- [x] 6.3 同步版本号：pom.xml + package.json + openapi.yaml
- [x] 6.4 重新生成后端接口（`mvn compile`，Controller 编译期校验）
- [x] 6.5 重新生成前端 SDK（`npm run generate:api`，`frontend/src/api/` 由生成器管理）

## 7. 前端 (frontend/src/ + apps/miniprogram/)
- [x] 7.1 N/A — frontend Web 包零手写变更（仅 SDK 生成，见 6.5）
- [x] 7.2 小程序 `src/pages/index/`：登录态骨架——`Taro.login()` 获取 code → 调 wechatLogin → `Taro.setStorageSync` 持久化 token → 页面展示登录态/用户名；失败展示错误提示（NutUI Toast/文本，沿用组件级引入约定）
- [x] 7.3 小程序 `src/__tests__/`：登录分流纯逻辑测试（token 持久化 key 契约 / 失败分支处理——如可抽纯函数则测纯函数，否则记录手工验证项）
- [x] 7.4 N/A — 无样式/动画变更（骨架级页面沿用现有样式）
- [x] 7.5 N/A — frontend 无新 vitest 用例（无 Web 端组件/hooks/store 变更）；小程序测试见 7.3
- [x] 7.6 N/A — Playwright E2E 不覆盖小程序运行时（微信开发者工具环境，无法在 CI 复现）——已核对
- [x] 7.7 N/A — 无 Web 端 E2E 流程变更（wechat-login 不经 Web 浏览器链路）——已核对

## 8. 文档同步
<!-- 逐项评估：未触及的文档类别也必须写明"现有描述已核对仍准确"，不得仅以"无新增"标记 N/A -->
- [x] 8.1 `docs/frontend/component-catalog.md` — 小程序 pages/index 登录态骨架（修改）→ 更新；Web 组件零变更
- [x] 8.2 `docs/database/schema.md` + `docs/uml/README.md` — `user.openid` 新增列 + 唯一索引 → 更新
- [x] 8.3 `docs/api/overview.md` — 新增 `/auth/wechat-login` 端点 → 更新
- [x] 8.4 `docs/architecture.md` + `CLAUDE.md` — 认证章节补微信登录（架构）+ 版本号/测试计数（CLAUDE.md 版本声明）→ 更新
- [x] 8.5 `README.md` — 版本号/功能清单 → 更新
- [x] 8.6 运行 `node scripts/docs-check.mjs` — 文档一致性检查通过

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过（含新增 wechat-login 用例）
- [x] 9.2 `turbo run verify` — 全量 lint + build + test 通过（frontend/shared/miniprogram 零回归 + SDK freshness）
- [x] 9.3 N/A — 无 Web 端 E2E 流程变更（已核对，见 7.7）
- [x] 9.4 Smoke test — 小程序开发者工具手工验证（mock 无法覆盖微信平台真实调用）：
  - [x] 以真实 appid + `WECHAT_APP_ID`/`WECHAT_APP_SECRET` 环境变量启动后端，小程序首页加载后展示"已登录"与用户名（2026-08-22 用户验证通过）
  - [x] 重启小程序（本地 token 失效场景）→ 重新静默登录成功，同一用户数据不重复开户（MySQL 验证：openid 非空用户恰 1 个）
  - [x] 构造无效 code（篡改本地 token 触发重登前手工调端点）→ 后端返回 400，页面展示失败提示（curl 验证 HTTP 400 + 失败提示分支此前已走通）
