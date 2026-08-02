# Tasks: pet-roam-robustness

## 1. 数据库迁移
- [x] 1.1 N/A — 无数据库变更

## 2. 领域层 (domain/)
- [x] 2.1 N/A — 无后端领域层变更

## 3. 基础设施层 (infrastructure/)
- [x] 3.1 N/A — 无后端基础设施层变更

## 4. 应用层 (application/)
- [x] 4.1 N/A — 无后端应用层变更

## 5. API 层 (api/)
- [x] 5.1 N/A — 无后端 API 层变更

## 6. 契约同步
- [x] 6.1 N/A — 无 API 契约变更（specs/openapi.yaml 仅版本号 3.3.4）
- [x] 6.2 N/A — 无 API 端点变更，无需 CHANGELOG 端点条目（仅版本号注释）
- [x] 6.3 同步版本号 3.3.3 → 3.3.4：pom.xml + package.json + openapi.yaml
- [x] 6.4 N/A — 后端接口无变化，无需 mvn compile 重新生成
- [x] 6.5 N/A — 前端 SDK 无变化，无需 generate:api

## 7. 前端 (frontend/src/)
- [x] 7.1 `modules/pet/lib/zoneRegistry.ts` — Zone 衰减改惰性过期：`getZones()` 读取时按 `createdAt + decayTime` 过滤并清理过期条目；`registerZone` 移除 decay setTimeout；注销函数签名保持兼容
- [x] 7.2 `modules/pet/components/RoamingPet.tsx` — 兴趣区 `decayTime: 15_000 → 45_000`
- [x] 7.3 `modules/pet/components/RoamingPet.tsx` — 游走 tick 回调改用 `usePetStore.getState()` 读取 position/lastInteractionTime/isResting（含进窝边沿判定、mode 判定、target 分支）；`scheduleWander` useCallback 依赖收敛为空
- [x] 7.4 `modules/pet/components/RoamingPet.tsx` — `moveDuration` 改 useMemo（依赖 `[isResting, pacingCellId]`），渲染不再重随机移动时长
- [x] 7.5 `assets/svg/OrangeCat.tsx` + `ShibaInu.tsx` — `<g transform="rotate(angle, cx, cy)">` 旧式逗号格式改 SVG2 空格分隔，消除 console 噪音
- [x] 7.6 更新 vitest 单测：
  - `lib/__tests__/zoneRegistry.test.ts` — 惰性过期（fake timers 超时后读取不可见 + 条目已清理）、无 decayTime 不过期、覆盖注册不误删
  - `components/__tests__/RoamingPet.test.tsx` — 渲染不重排游走 timer 用例 + 现有进窝/往返/边沿守卫用例回归
- [x] 7.7 N/A — 无用户流程变化，无需新增 Playwright E2E（既有 e2e 回归在 9.3）

## 8. 文档同步
- [x] 8.1 N/A — 无新前端组件
- [x] 8.2 N/A — 无新实体/表/字段
- [x] 8.3 N/A — 无新 API 端点
- [x] 8.4 `CLAUDE.md` 版本声明 v3.3.3 → v3.3.4（核心能力描述补健壮性说明）

## 9. 全量验证
- [x] 9.1 `cd backend && mvn test` — 后端单元测试全部通过（回归）
- [x] 9.2 `cd frontend && pnpm run verify` — 前端 lint + tsc + build + vitest 全部通过
- [x] 9.3 `cd frontend && npm run test:e2e` — Playwright E2E 全部通过（回归）
- [x] 9.4 Smoke test — 启动前后端，浏览器手工验证：
  - [x] console 无 SVG transform 警告（已实测 0 条；outdated JSX transform 为预存 React 提示非本次引入）
  - [x] 宠物游走：tick 节奏稳定（24.2s 在 10-30s 内），进窝/往返行为正常（4s pace 为格内往返正常节奏）
  - [x] 鼠标停留 3s 兴趣吸引仍生效（Zone 保鲜期 45s 内宠物到达目标）
