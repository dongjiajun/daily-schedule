# Mini Program Foundation（微信小程序工程骨架）

## Purpose
Phase 2 主链（M2.1-2.2）起点：Taro 4.2 + React 18 小程序工程接入 monorepo，NutUI 组件库落地，shared 包跨端复用验证——后续 6 个小程序变更在此骨架上叠加。

## Requirements

### Requirement: Taro 工程骨架
`apps/miniprogram/` SHALL 创建 Taro 4.2 + React 18 工程（微信小程序 target，TypeScript；React 18 为 Taro 4.2 与 NutUI beta 的 peer 共同支持面），包含：`src/app.config.ts`（TabBar 两页：首页/我的）、`src/pages/index/` 与 `src/pages/profile/` 基础页面、`project.config.json`（微信开发者工具导入配置）、`babel.config.js`。工程 SHALL 通过 `pnpm install` 在 workspace 内解析依赖，独立于 frontend 包运行。

#### Scenario: 工程结构完整
- **WHEN** 查看 `apps/miniprogram/` 目录
- **THEN** 存在 package.json / tsconfig.json / babel.config.cjs / project.config.json / src/app.config.ts / src/pages/index/ / src/pages/profile/

#### Scenario: TabBar 两页可路由
- **WHEN** 小程序构建产物导入微信开发者工具
- **THEN** 底部 TabBar 显示「首页」与「我的」两个入口，点击可切换页面

### Requirement: NutUI 组件库接入
工程 SHALL 引入 `@nutui/nutui-react-taro`（锁定当前 4.0.0-beta.5 版本）并在首页渲染至少一个 NutUI 组件（如 `Button`）验证组件库在小程序构建链路可用。beta 风险 SHALL 以锁定版本 + 最小使用面控制。引入 SHALL 使用组件级路径（`dist/es/packages/<name>` + `style/css`），SHALL NOT 使用 barrel 入口（带全量样式）。

#### Scenario: NutUI 组件渲染
- **WHEN** 首页使用 NutUI `Button` 组件并构建
- **THEN** 构建成功，微信开发者工具中按钮正常渲染与点击

#### Scenario: 组件级引入避免全量样式
- **WHEN** 构建产物生成
- **THEN** 页面 wxss 仅含 button 组件样式（非全量 NutUI 样式表）

### Requirement: shared 包跨端复用
小程序 SHALL 复用 `@daily-schedule/shared` 的纯函数引擎：`import { holidayEngine } from '@daily-schedule/shared/holiday'`（节日判定）与 `import { computeNextTarget } from '@daily-schedule/shared/pet'`（游走目标计算）。SHALL 通过 tsc 类型检查 + Taro 构建产物包含 shared 代码。若发现跨端兼容问题（ESM 解析/运行时 API），SHALL 在 shared 包做最小适配并补充 shared 侧测试。

#### Scenario: holiday 引擎复用编译通过
- **WHEN** 小程序页面 import `holidayEngine` 并调用判定函数
- **THEN** `pnpm build`（Taro build）成功，产物含 holiday 引擎代码

#### Scenario: pet 引擎复用编译通过
- **WHEN** 小程序页面 import `computeNextTarget` 并计算游走目标
- **THEN** 构建成功，计算结果与 Web 端一致（纯函数无平台依赖）

#### Scenario: 跨端复用自动化回归
- **WHEN** 运行 `pnpm run test`（vitest）
- **THEN** shared 复用测试通过（holiday 判定确定性 + pet 引擎视口约束）

### Requirement: workspace 与 turbo 接入
`pnpm-workspace.yaml` SHALL 增加 `apps/*`；`turbo.json` 任务 SHALL 覆盖 miniprogram（`build` 依赖 `^build` 以先构建 shared；`dev` persistent）。`turbo run verify` SHALL 在 miniprogram 的 lint/build/test 失败时非零退出（CI 门禁扩展）。

#### Scenario: workspace 解析
- **WHEN** 根目录执行 `pnpm install`
- **THEN** `apps/miniprogram` 依赖解析成功（含 workspace 内 `@daily-schedule/shared` 链接）

#### Scenario: turbo verify 覆盖小程序
- **WHEN** `apps/miniprogram` 的 lint、test 或 build 失败
- **THEN** `turbo run verify` 非零退出

### Requirement: 构建产物可导入微信开发者工具
`pnpm build`（Taro build --type weapp）SHALL 产出 `apps/miniprogram/dist/`（含 app.json / pages / project.config.json），可直接作为微信开发者工具项目目录导入。README SHALL 记录构建与导入步骤。

#### Scenario: 构建产物完整
- **WHEN** 执行 Taro weapp 构建
- **THEN** `dist/` 含 `app.json`、`app.js`、`pages/index/` 与 `project.config.json`，开发者工具导入后无编译错误

#### Scenario: 真实 appid 导入
- **WHEN** 开发者工具以真实 appid（wx5e08cd97d50b9d56）导入项目
- **THEN** 编译通过，页面正常渲染（2026-08-16 用户导入验证）
