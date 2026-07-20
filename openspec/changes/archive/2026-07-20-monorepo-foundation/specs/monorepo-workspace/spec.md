# Monorepo Workspace

基于 pnpm workspace + Turborepo 的 Monorepo 项目结构，支撑多包并行构建与任务编排。

## ADDED Requirements

### Requirement: Workspace Root Configuration

项目根目录 SHALL 提供 `package.json`（声明为 `private: true`）、`pnpm-workspace.yaml` 和 `turbo.json` 三个配置文件，共同定义 Monorepo 的包边界和任务编排规则。

- `pnpm-workspace.yaml` MUST 声明 `frontend` 和 `packages/*` 为 workspace 成员
- `turbo.json` MUST 定义 `build` 任务的依赖关系：`build` 依赖 `^build`（先构建被依赖的包）
- 根 `package.json` MUST 提供 `dev`、`build`、`lint`、`test`、`verify` 脚本，委托给 `turbo run`

#### Scenario: 开发者运行全量构建

- **WHEN** 在根目录执行 `pnpm run build`
- **THEN** Turborepo SHALL 按 `turbo.json` 中 `build` 任务的 `dependsOn` 顺序构建所有包
- **THEN** `packages/shared` 先于 `frontend` 构建
- **THEN** 若 shared 源码未变更且 dist 输出存在，Turborepo SHALL 命中缓存并跳过 shared 构建

#### Scenario: 开发者运行全量验证

- **WHEN** 在根目录执行 `pnpm run verify`
- **THEN** Turborepo SHALL 依次执行 `lint` → `build` → `test`（按 `dependsOn` 声明）
- **THEN** 任一任务失败时，后续任务 SHALL 不执行

#### Scenario: CI 环境全量构建

- **WHEN** CI 执行 `pnpm install && pnpm run build`
- **THEN** pnpm SHALL 根据 `pnpm-lock.yaml` 安装所有依赖
- **THEN** Turborepo SHALL 构建所有包，CI 退出码反映构建结果

### Requirement: Package Manager Enforcement

项目 MUST 使用 pnpm 作为唯一包管理器。

- 根目录 `.npmrc` MUST 包含 `engine-strict=true` 以强制 pnpm
- `package.json` 中 SHOULD 声明 `"packageManager": "pnpm@<version>"` 以配合 `corepack` 使用

#### Scenario: 使用 npm/yarn 安装

- **WHEN** 开发者在根目录执行 `npm install` 或 `yarn install`
- **THEN** 包管理器 SHALL 因 `engine-strict` 配置拒绝安装并提示使用 pnpm

### Requirement: Existing Frontend Compatibility

`frontend/` 目录结构、脚本和构建流程 MUST 保持可用。

- `frontend/package.json` 的现有 `scripts` MUST 保持不变
- `cd frontend && npm run dev` MUST 仍然可启动 Vite 开发服务器
- `cd frontend && npm run verify` MUST 仍然通过 lint + build + test
- Vite 代理配置（`/api` → `localhost:8080`）MUST 不受影响

#### Scenario: 开发者仅需前端开发

- **WHEN** 开发者在 `frontend/` 目录执行 `pnpm run dev`
- **THEN** Vite 开发服务器 SHALL 在 `:5173` 启动
- **THEN** API 代理 SHALL 正常转发到 `localhost:8080`

#### Scenario: 提交前验证保持不变

- **WHEN** 开发者在 `frontend/` 目录执行 `pnpm run verify`
- **THEN** ESLint、TypeScript 编译、Vite 构建、vitest 测试 SHALL 全部通过

## Test Coverage

| Scenario | 测试方式 | 状态 |
|----------|---------|------|
| 开发者运行全量构建 | 手动执行 `pnpm run build` | ➕ |
| 开发者运行全量验证 | 手动执行 `pnpm run verify` | ➕ |
| CI 环境全量构建 | CI workflow 自动验证 | ➕ |
| 使用 npm/yarn 安装 | 手动执行 `npm install` 验证拒绝 | ➕ |
| 开发者仅需前端开发 | 手动执行 `pnpm run dev` | ➕ |
| 提交前验证保持不变 | `npm run verify`（现有 CI 流程） | ➕ |
