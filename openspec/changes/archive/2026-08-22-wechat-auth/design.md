# Design: 微信小程序登录（wechat-auth）

<!-- 参考: docs/architecture.md + CLAUDE.md 技术约定 -->

## Context

小程序骨架（miniprogram-foundation）已接入 monorepo 并通过真实 appid 导入验证，但尚无认证能力。Web 端已有完整的用户名密码认证链路（`AuthApplicationService.register/login/refresh` + `JwtUtil` 签发 access 15min / refresh 7d + `JwtAuthFilter` 校验 + SSE Cookie）。微信端需要平台标准登录路径 `wx.login`（code → openid）与现有 JWT 会话体系对接，做到「同一套 JWT、同一套数据隔离、同一套业务 API」。

约束：
- 契约驱动：`specs/openapi.yaml` 是唯一真相源，Controller 必须实现生成接口
- 所有业务表 `user_id` 隔离；`user` 表 `username` NOT NULL UNIQUE、`password_hash` NOT NULL
- Flyway 已到 V8；H2 测试 schema 需同步
- 仓库不落微信 app-secret 明文

## Goals / Non-Goals

**Goals:**
- 小程序 `wx.login` code → 后端 jscode2session → openid → 静默登录/注册 → 标准 JWT 会话
- 与 Web 认证链路并存互不干扰（同一 `user` 表，`openid` 可空）
- 小程序首页骨架级登录态验证（code→JWT 链路跑通）

**Non-Goals:**
- 手机号绑定 / unionid 多端打通（后续变更）
- 微信用户资料拉取（头像昵称走 open-data，本变更不做）
- 小程序完整业务页（日历/任务/宠物在各自变更接入认证）
- Web 端微信扫码登录

## Decisions

### Decision 1: 微信登录端点复用 `LoginResponse` 而非新响应结构
- **选择**: `POST /auth/wechat-login` 响应直接 `$ref: LoginResponse`（accessToken/refreshToken/expiresIn/user）
- **理由**: 小程序后续业务请求与 Web 共用同一 Bearer 体系；前端 SDK 复用同一类型，零新响应模型
- **备选方案**: 单独 `WechatLoginResponse`（无 refreshToken）——被否决：小程序也需要长期会话，refresh 链路复用现有 `/auth/refresh` 即可，双结构徒增维护面

### Decision 2: HTTP 客户端选型——Spring Boot 内置 `RestClient`
- **选择**: Spring 6.1+ 内置 `RestClient`（`RestClient.builder()`）调用 jscode2session
- **理由**: Spring Boot 3.4 已自带，零新依赖；同步调用契合登录请求-响应模型；`RestClient` 是 RestTemplate 的现代替代（流式 API、更清晰异常处理）
- **备选方案**: WebClient（需要 reactor 依赖与异步心智负担，登录链路无高并发收益）；直接 HttpURLConnection（样板代码多）；引入 okhttp 等第三方（违反零新依赖原则）

### Decision 3: 微信上游错误语义——40029→400，其余→502
- **选择**: 新增 `WechatApiException`（基础设施层），`GlobalExceptionHandler` 按 errcode 映射：40029 → 400（凭证无效，客户端可重试 wx.login）；其余 errcode / 网络异常 → 502（上游服务错误）
- **理由**: 40029 是「code 过期/已用」的客户端语义，400 让小程序端直接提示重新登录；appid 配置错误、微信服务波动等属于上游问题，502 语义准确且不与现有 4xx 混同。响应仍走 `ApiResponse { code, message }` 统一结构，message 不泄露微信内部错误详情
- **备选方案**: 全部映射 500——被否决：混淆客户端/服务端错误；全部 401——被否决：401 在现有语义中是「JWT 无效」，会触发小程序端强制登出重试循环

### Decision 4: 微信用户 username 生成规则 + 不可登录密码
- **选择**: username = `wx_` + openid 前 12 位（openid 去掉 `-` 后取前 12），共 15 字符；`password_hash` 存 `BCrypt(UUID.randomUUID())`；`displayName` 默认 `微信用户_<openid 后 4 位>`
- **理由**: username 满足 NOT NULL UNIQUE 与 `^[a-zA-Z0-9_]+$` 约束；openid 前 12 位在 28 位 openid 下碰撞概率可忽略，且 uk_user_openid 唯一约束兜底（极端碰撞时按已有用户登录，不报错）。随机 UUID 的 BCrypt 哈希使该账号无法通过密码登录（`canLogin` 逻辑不变，哈希永不匹配任何输入）
- **备选方案**: username 直接用完整 openid——被否决：微信 openid 形如 `oX1xK4xxx...`，含大小写字母数字下划线连字符，去 `-` 后 28 位虽合法但暴露 openid 于用户名展示面；纯 UUID 用户名——被否决：不可读、排查困难

### Decision 5: `WechatClient` 作为基础设施端口，应用层依赖接口
- **选择**: 领域/应用层定义 `WechatAuthPort` 接口（`resolveOpenId(String code)`），基础设施 `WechatClient`（`@Component`）实现
- **理由**: 遵循依赖倒置——应用层不依赖 HTTP 细节，单测可 Mock 端口（`@MockitoBean`），无需真实微信调用即可覆盖全部分流逻辑
- **备选方案**: 应用层直接注入 `RestClient`——被否决：违反 DDD 分层，测试需 mock HTTP 层，脆弱

## DDD Layer Design

### 领域层 (domain/user/)
- `User` 实体：新增 `openid` 字段 + getter/setter（可空；其余不变）
- `UserRepository`：新增 `Optional<User> findByOpenid(String openid)`

### 基础设施层 (infrastructure/)
- **persistence**: `UserPO` 补 `openid` 字段；`UserMapper` 补按 openid 查询（`eq("openid", ...)` 或注解 SQL）；`UserRepositoryImpl` 实现 `findByOpenid`；UserPO→User 转换补 openid
- **wechat**（新包 `infrastructure/wechat/`）: `WechatClient`（`@Component`，`RestClient` 调 `GET https://api.weixin.qq.com/sns/jscode2session`，参数 appid/secret/js_code/grant_type=authorization_code；解析 `errcode`/`openid`/`session_key`，非零 errcode 抛 `WechatApiException(errcode)`，网络异常包装为 errcode -1）+ `WechatApiException`
- **config**: `WechatProperties`（`@ConfigurationProperties(prefix = "wechat")`，字段 appId/appSecret）或 `@Value` 注入——与 `application.yml` `wechat.app-id: ${WECHAT_APP_ID:}` 占位符配合
- **migration**: `V9__add_user_openid.sql`（`ALTER TABLE user ADD COLUMN openid VARCHAR(64) NULL AFTER id` + `ADD UNIQUE KEY uk_user_openid (openid)`）
- **security**: `SecurityConfig` 无需变更（wechat-login 与 login 同在 `/auth/**` permitAll 下——需核对现有 permitAll 列表是否覆盖 `/auth/wechat-login`，若是 `/auth/**` 通配则零变更）

### 应用层 (application/auth/)
- `AuthApplicationService.wechatLogin(WechatLoginCommand code)`：
  1. code 空校验（`IllegalArgumentException` → 400）
  2. `wechatAuthPort.resolveOpenId(code)`（异常直接上抛 → 400/502）
  3. `userRepository.findByOpenid(openid)` 命中 → `issueTokens` 返回；未命中 → 创建 `User`（username `wx_` 前缀规则、随机 BCrypt 哈希、openid、displayName）→ `userRepository.save` → `seedDefaultCategories`（与 register 一致的默认分类体验）→ `issueTokens`
  4. 事务边界：注册路径 `@Transactional`（与 register 一致）；登录命中路径只读
- 新增 record `WechatLoginCommand(String code)`

### API 层 (api/)
- `AuthController` 实现生成的 `wechatLogin` 接口方法 → 委托应用层 → 组装 `LoginResponse`（复用现有 assembler 逻辑，抽出 `toLoginResponse(Tokens)` 私有方法供 login/wechatLogin 共用）
- `GlobalExceptionHandler` 新增 `@ExceptionHandler(WechatApiException.class)`：errcode 40029 → 400，其余 → 502（`@ResponseStatus` 按实例属性动态处理，或拆两个 handler 方法）

### 前端（frontend/）
- 仅 `npm run generate:api` 重新生成 SDK（新增 `wechatLogin` 方法与类型），无手写组件/状态变更

### 小程序（apps/miniprogram/）
- `src/pages/index/` 骨架级接入：`Taro.login()` → 调 wechat-login SDK → `Taro.setStorageSync('accessToken'/'refreshToken'/...)` → 展示登录态；失败 toast 提示
- 请求封装暂不建（后续变更随业务页引入）

## API Design

`specs/openapi.yaml` 新增（`/auth/login` 之后）：

```yaml
/auth/wechat-login:
  post:
    operationId: wechatLogin
    tags: [Auth]
    summary: 微信小程序登录（wx.login code 换 JWT，未注册自动开户）
    security: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/WechatLoginRequest'
    responses:
      '200': { $ref 到 LoginResponse（含 Set-Cookie 头同 login） }
      '400': BadRequest
      '502': BadGateway（新 components/responses 条目）

WechatLoginRequest:
  type: object
  required: [code]
  properties:
    code: { type: string, description: wx.login 返回的临时凭证 }
```

- 请求 `WechatLoginRequest { code: string (required) }`
- 响应 200 `LoginResponse`（accessToken/refreshToken/expiresIn/user）
- 错误：400（code 空/无效）/ 502（微信上游错误）
- 契约同步：`specs/CHANGELOG.md` + openapi.yaml/pom.xml/package.json 三处版本号

## Database Design

- 迁移 `V9__add_user_openid.sql`：
  ```sql
  ALTER TABLE `user` ADD COLUMN openid VARCHAR(64) NULL AFTER id;
  ALTER TABLE `user` ADD UNIQUE KEY uk_user_openid (openid);
  ```
- 迁移 `V10__make_user_email_nullable.sql`（smoke test 暴露的约束冲突，追加）：
  ```sql
  ALTER TABLE `user` MODIFY COLUMN email VARCHAR(120) NULL;
  ```
  微信静默注册的 User.email 为 NULL，而 MySQL `user.email` 原为 NOT NULL 无默认值 → insert 被拒（H2 测试表无 email 列，单元测试未暴露）。email 改可空后语义不变：Web 注册仍必填，微信用户为 NULL。
- MySQL 可空列 UNIQUE 允许多个 NULL（Web 老用户不受影响）
- `backend/src/test/resources/schema-h2.sql` 的 user 表 DDL 同步补 `openid VARCHAR(64) NULL` + UNIQUE 约束（H2 同样支持可空列唯一索引）
- 无数据回填（存量用户 openid 保持 NULL）

## Risks / Trade-offs

- [微信 API 凭证泄露] → app-secret 仅环境变量注入，仓库/日志零明文；`WechatClient` 不打印 code/secret（日志脱敏）
- [openid 唯一约束与并发注册竞争] → 同 openid 并发首登时唯一键兜底；`findByOpenid` 命中优先，极小概率的竞态以数据库约束失败映射 409（重试即登录）
- [code 一次性] → 微信 code 5 分钟有效且一次有效；40029 映射 400 让小程序端自动重新 `wx.login` 重试
- [jscode2session 调用延迟] → 登录链路同步等待（1-3s 典型）；后续如出现慢调用可加超时配置（RestClient 默认连接超时即可，本变更不调优）
- [依赖微信网络可用性] → 微信服务波动 → 502 + 前端「登录失败请重试」，不阻塞 Web 端认证链路

## Migration Plan

1. 部署顺序：先迁移（Flyway V9 自动执行，向后兼容——新列可空，存量用户无感）→ 后端发布 → 前端 SDK 再生成（契约先于代码，同一 PR）
2. 回滚：V9 为纯加列，回滚 = `ALTER TABLE user DROP INDEX uk_user_openid, DROP COLUMN openid`（或 Flyway undo）；后端回滚为移除端点，不影响既有功能
3. 验证：`mvn test`（H2 含 openid 用例）+ `turbo run verify` + 小程序开发者工具真机/模拟器登录链路

## Open Questions

- 微信开放平台 appid 与 secret：本地开发用什么 appid？（用户已导入真实 appid wx5e08cd97d50b9d56——需用户提供对应 secret 环境变量；未提供时端点返回 502，测试用 Mock 覆盖）
- `SecurityConfig` permitAll 列表当前写法需 apply 阶段核对（`/auth/**` 通配则无需改，精确列表则补 `/auth/wechat-login`）
