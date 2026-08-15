# Proposal: frontend-quick-polish

## Why
四线调查发现 4 个低成本高感知的前端问题:全站弹窗动画因缺失 `tw-animate-css` 依赖而从未编译生效(生硬感最大来源)、宠物模块使用全项目未定义的 Tailwind 类导致样式缺失、`lang="en"` 与全站中文不符、framer-motion 不尊重 reduced-motion 偏好。一次变更集中修复,为后续 UX 打磨(P7-P16)建立体验基线。

## What Changes
- 安装 `tw-animate-css`,恢复 dialog/popover/select 组件已书写的 `animate-in`/`zoom-in-95` 等入场动画(依赖缺失,编译后 CSS 零命中)
- 修复宠物模块 5 个文件使用未定义类的问题:`bg-muted` → `bg-hover`、`text-muted-foreground` → 既有 `text-foreground-muted`(全项目未定义 `--color-muted`)
- `index.html`:`lang="en"` → `lang="zh-CN"`(屏幕阅读器);移除/修正与主题不符的固定蓝 `theme-color` meta
- App 根节点加 `<MotionConfig reducedMotion="user">`,全站动效尊重系统减弱动态偏好
- 文档勘误:`component-catalog.md` 与 moduleRegistry 注释宣称的"lazy 路由"与实现(静态 import)不符,修正为实际描述

## Capabilities

### New Capabilities
- `frontend-experience-baseline`: 前端体验基线——弹层动画生效、主题 token 使用规范、文档语言与动效偏好(后续 UX 打磨变更将持续 MODIFIED 此能力)

### Modified Capabilities
无

## API Contract Impact
无——纯前端变更,不触碰 `specs/openapi.yaml`,无需重生成 SDK,版本号不同步。

## DDD Layer Impact
无后端层级影响(纯前端变更)。

## Database Impact
无需迁移。

## Impact
- 前端:`package.json`(新增 tw-animate-css)、`index.html`、`App.tsx`、`core/components/ui/`(无改动,依赖生效)、`modules/pet/` 5 个组件文件(PetMenu/PetStatus/SidebarPet/PetPage/PetSelection)
- 文档:`docs/frontend/component-catalog.md` 勘误
- 测试:无需新增单测(纯样式/配置变更),`pnpm run verify` + 视觉验证弹窗动画
