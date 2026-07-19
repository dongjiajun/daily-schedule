# Proposal: 项目结构清理 v3.1

## Why

项目经过多个迭代积累了一些冗余文件、风格不一致和文档过时问题。在 v3.1 稳定后，需要做一次系统性清理，保持代码库整洁，降低新开发者上手成本。

## What Changes

- **删除过时文档**: `docs/design/multi-user-auth.md`（v3.0 已实现，正式 spec 已覆盖）
- **删除未使用资源**: `react.svg`、`vite.svg`、`icons.svg`（Vite 模板残留）
- **删除放错位置的文件**: `backend/src/main/resources/maven-settings.xml`（不应打包进 JAR）
- **替换模板 README**: `frontend/README.md`（当前为 Vite 脚手架默认内容）
- **新增项目入口文档**: 根目录 `README.md`
- **统一前端 import 风格**: 全部使用 `@/` 路径别名（当前混用相对路径和别名）
- **补充前端测试基础设施**: 添加 vitest + @testing-library，编写核心模块基础测试
- **补充后端测试覆盖**: 补齐缺失的 Controller/Repository/Assembler 测试
- **同步文档**: 更新 CLAUDE.md 使其与实际文件结构一致

## Capabilities

### New Capabilities

无。本变更不新增功能能力。

### Modified Capabilities

无。本变更不涉及需求级变更。

## API Contract Impact

无。`specs/openapi.yaml` 不涉及修改。

## DDD Layer Impact

无。后端代码结构不变更，仅补充测试和删除一个放错位置的配置文件。

## Database Impact

无。不需要新的 Flyway 迁移。

## Impact

- **文档**: 删除 `docs/design/multi-user-auth.md`，更新 `frontend/README.md`，新增根 `README.md`
- **前端**: import 路径重构（8 个文件），新增 vitest 测试框架和测试文件，删除 3 个资源文件
- **后端**: 删除 `maven-settings.xml`，新增 9 个测试类
- **CI**: `.github/workflows/ci.yml` 前端 job 增加 `npm test` 步骤
- **CLAUDE.md**: 更新测试覆盖数字、文档引用路径
