# Design: 微信小程序工程骨架（miniprogram-foundation）

## Context

**现状**：
- monorepo：pnpm workspace 含 `frontend` + `packages/shared`（turbo 编排 verify = lint + build + test）
- shared 包：ESM 输出（`type: module`），`@daily-schedule/shared/holiday` 与 `/pet` 独立导出纯函数引擎（HolidayEngine、roam engine），vitest 测试
- 环境：Node 22；npm registry 可用
- 版本核实：`@tarojs/taro` 最新 4.2.1（4.x 稳定）；`@nutui/nutui-react-taro` 4.0.0-beta.5（规划指定组件库，仍在 beta）

**约束**：Phase 2 规划（phase2-execution-plan.md）写死 Taro 4.x + NutUI；后续 6 个小程序变更依赖本骨架；CI 五层门禁需覆盖小程序构建；微信开发者工具导入需 appid（可用测试号）。

## Goals / Non-Goals

**Goals:**
- Taro 4.2 + React 19 工程接入 workspace，TabBar 骨架可构建、可导入开发者工具
- NutUI 落地（锁定版本 + 最小使用面）
- shared 跨端复用验证（holiday/pet 两路）
- turbo/CI 门禁覆盖小程序构建

**Non-Goals:**
- 不做小程序业务功能（auth/calendar/todo 是后续变更）
- 不引入小程序单测框架（Taro jest 配置重、小程序 API 在 jsdom 下不可用——本变更以构建验证为主，后续需要时再上）
- 不做 CI 上的微信开发者工具自动化（无 headless 微信环境，构建产物验证为准）

## Decisions

### Decision 1: 手工搭建工程文件（不用 Taro CLI 交互式初始化）
- **选择**: 按 Taro 4 官方模板结构手工创建 `apps/miniprogram/`（package.json / config/index.ts / babel.config.js / project.config.json / tsconfig.json / src/app.ts + app.config.ts + pages）
- **理由**: `taro init` 是交互式命令，非交互环境不可控；手工搭建版本完全锁定（4.2.1）、结构透明，diff 可审查
- **备选方案**: `npm create taro` 交互式——同问题且生成冗余模板；复制官方模板仓库——引入不可控的模板演进

### Decision 2: Taro 4.2 + React 18 依赖组合
- **选择**: `@tarojs/taro@4.2.1` + `@tarojs/cli@4.2.1` + `@tarojs/components` + `@tarojs/plugin-framework-react` + `@tarojs/react` + `react@18` + `react-dom@18` + `@tarojs/webpack5-runner`（构建器）
- **理由**: 实施时核实 `@tarojs/react@4.2.1` peerDependencies 为 `react: ^18`、`@nutui/nutui-react-taro@4.0.0-beta.5` peer 为 `^16.8 || ^17 || ^18`——**两者均不支持 React 19**，React 18 是共同支持面；pnpm workspace 按包隔离 node_modules，小程序 React 18 与 frontend React 19 并存无冲突；webpack5-runner 是 4.x 默认构建器
- **备选方案**: React 19——Taro/NutUI peer 声明不满足，构建期类型与运行时报错风险高；Taro 3.x——规划写死 4.x，且 4.x 已稳定（4.2.1 多次 patch）

### Decision 3: NutUI 锁定 beta 版本 + 最小使用面
- **选择**: `@nutui/nutui-react-taro@4.0.0-beta.5` 精确锁定（无 `^`），首页仅用 `Button` 一个组件验证渲染链路
- **理由**: 规划指定 NutUI；beta 风险通过锁版本（防 beta 漂移）+ 最小使用面（单组件）控制，后续变更需要更多组件时再评估升级
- **备选方案**: 换 Taro UI（已停止维护，长期风险更大）；自研组件（重、违背规划）；等 NutUI 正式版（主链零 slack 不可等）

### Decision 4: shared 复用走默认解析 + 构建验证为准
- **选择**: 小程序页面直接 `import { holidayEngine } from '@daily-schedule/shared/holiday'`；Taro webpack 对 workspace 符号链接包按 node_modules 依赖处理（babel 转译）；不预先做 shared 侧改动
- **理由**: shared 输出纯 ESM 且无平台 API（纯函数），理论上直接可用；Taro webpack5 对 ESM node_modules 依赖的转译链路成熟；先验证再决定是否适配
- **备选方案**: 预先把 shared 改为双格式（CJS+ESM）输出——未经验证的预防性改动，违背最小变更；webpack alias 到 src 直接编译——绕开包构建产物，掩盖真实分发问题，且 CI 语义不同

### Decision 5: turbo 任务与 CI 门禁
- **选择**: `turbo.json` 复用现有 `build`/`lint`/`verify` 任务名（miniprogram 包内脚本映射到 Taro 命令：build = `taro build --type weapp`、dev = `taro build --type weapp --watch`、lint = eslint）；miniprogram 的 `verify` 同样 = lint + build（无 test）
- **理由**: turbo 任务按包名自动分派，无需新增任务类型；CI 的 `turbo run verify` 自然覆盖小程序 lint + 构建
- **备选方案**: 独立 `build:weapp` 任务名——turbo 需要新任务定义 + CI 脚本改动，破坏统一门禁

### Decision 6: project.config.json 用测试号
- **选择**: appid 初始填 `touristappid`（微信测试号），`compileType: miniprogram`，`miniprogramRoot: dist/`
- **理由**: 无真实 appid 时开发者工具用测试号可直接导入运行
- **更新（2026-08-16）**: 用户导入开发者工具时已替换为真实 appid `wx5e08cd97d50b9d56`（提前于 wechat-auth 变更），工具自动补充 setting 字段——骨架交付后 appid 即生产值，wechat-auth 变更直接复用
- **备选方案**: 留空 appid——开发者工具每次导入都弹配置，体验差

### Decision 7: 构建验证作为本变更测试策略
- **选择**: 不引入小程序单测；验证 = `tsc --noEmit`（类型）+ `taro build --type weapp` 成功 + 产物结构断言（dist/app.json、pages/index/、project.config.json 存在）+ shared 引擎在产物中的引用检查
- **理由**: Taro 单测（jest + 小程序 API mock）配置成本高且 jsdom 与小程序运行时差异大；骨架阶段核心风险是构建链路而非业务逻辑（业务逻辑在后续变更补测）
- **备选方案**: 现在就上 Taro jest——为骨架阶段无业务代码的工程配重测试设施，性价比低

## DDD Layer Design
后端零变更（纯前端工程）。

### 小程序工程结构 (apps/miniprogram/)
```
apps/miniprogram/
├── package.json            # @daily-schedule/miniprogram，scripts: dev/build/lint/verify
├── tsconfig.json           # 继承前端 tsconfig 风格（jsx: react-jsx、target es2023）
├── babel.config.js         # Taro 4 预设
├── project.config.json     # appid: touristappid，miniprogramRoot: dist/
├── config/
│   ├── index.ts            # Taro 编译配置（designWidth 750、framework react、outputRoot dist）
│   ├── dev.ts / prod.ts    # 环境覆盖（prod 压缩）
└── src/
    ├── app.ts              # 入口
    ├── app.config.ts       # pages: index/profile，tabBar 两页
    ├── pages/
    │   ├── index/          # 首页：NutUI Button + holidayEngine 判定展示 + 游走目标计算
    │   └── profile/        # 我的：占位
    └── app.scss
```

### 前端 (frontend/src/)
零变更。

## API Design
无契约变更（不触碰 openapi.yaml / SDK / 版本号）。

## Database Design
无数据库变更。

## Risks / Trade-offs
- **[NutUI beta 稳定性]** → 锁精确版本 + 单组件使用面；构建失败时降级方案：首页改纯 Taro View/Text 组件（NutUI 依赖移除），组件库决策顺延到第一个业务页面变更
- **[Taro webpack 解析 pnpm symlink 的 workspace 包失败]** → 若构建报错无法解析 shared：优先 Taro config `alias` 显式指向 `packages/shared/dist`；仍失败则 shared 补 CJS 输出（最小适配，回写 shared 包并补测试）
- **[React 19 与 @tarojs/react 兼容]** → 4.2.1 官方声明支持 React 19；构建验证立即暴露（Taro renderer 版本冲突会直接编译失败）
- **[turbo verify 纳入小程序后 CI 时长增加]** → weapp 构建增量缓存（turbo outputs dist）；首次构建预计 1-3 分钟可接受
- **[测试号 appid 无法真机预览]** → 骨架阶段开发者工具模拟器验证足够；真机联调在 wechat-auth 变更（真实 appid 到位）时进行

## Migration Plan
- **部署**: 无运行时部署（小程序代码包后续变更统一由开发者工具上传）
- **回滚**: 删除 `apps/miniprogram/` 目录 + 还原 workspace/turbo 配置即可，无数据/契约影响
- **验证顺序**: `pnpm install` → miniprogram `tsc --noEmit` → `taro build --type weapp` → 产物结构检查 → 根目录 `turbo run verify` → 手工导入微信开发者工具确认 TabBar 与 Button 渲染

## Open Questions
无。NutUI 正式版发布后（预计 Phase 2 中期）可在后续变更中升级并扩大组件使用面。
