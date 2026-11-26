# Holiday Effects

## ADDED Requirements

### Requirement: 重型粒子特效按需懒加载

`EffectLayer` 中的 `FireworkEffect` 与 `LanternFallEffect` SHALL 通过 `React.lazy()` 按需异步加载，并由 `Suspense fallback={null}` 与局部静默错误边界包裹；纯 CSS 特效（雪花、花瓣、落叶、爱心）保持同步渲染，常规工作日与未启用粒子节日不请求 `tsparticles` 脚本。

#### Scenario: 常规或纯 CSS 特效日不加载粒子引擎

- **WHEN** `activeHolidayId` 为空、`effectIntensity = 'off'`、`prefers-reduced-motion: reduce` 或节日仅使用纯 CSS 特效（雪花/花瓣/落叶/爱心）
- **THEN** 系统 SHALL NOT 触发 `FireworkEffect`、`LanternFallEffect` 或 `@tsparticles` 分片加载

#### Scenario: 粒子节日异步挂载并在分片失败时静默降级

- **WHEN** 当前节日激活 `firework`（春节）或 `lantern`（中秋/元宵等）且未触发性能关闭条件
- **THEN** `EffectLayer` SHALL 异步加载并渲染 `firework-particles` 或 `lantern-particles`，且保持 `pointer-events: none`
- **WHEN** 粒子特效异步分片加载或渲染失败抛出异常
- **THEN** `EffectLayer` 局部静默错误边界 SHALL 捕获异常并静默降级（不崩溃主页面、不阻断交互），并在节日切换重置后允许恢复
