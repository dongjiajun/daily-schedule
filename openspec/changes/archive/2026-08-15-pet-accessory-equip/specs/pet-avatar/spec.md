# Pet Avatar（宠物形象展示）

## MODIFIED Requirements

### Requirement: SVG 插画 + CSS 动画层渲染
系统 SHALL 使用 `SvgAvatar`（按 species 选择 `OrangeCat`/`ShibaInu` SVG 插画组件）渲染宠物形象，插画内嵌 CSS 动画层响应 petStore 的 `action` 与 `emotionState`：action 驱动连续动画（呼吸/眨眼/步伐/睡眠），emotionState 切换脸部参数（嘴型/眼睛/耳朵/尾巴角度）。`SvgAvatar` SHALL 支持可选 `accessory` prop（配饰名称）：装备时渲染装扮层（`AccessoryOverlay` 叠加层或皮肤 filter），未装备（null）时形象与既有表现完全一致；装扮 SHALL 在 RoamingPet / PetPage / SidebarPet 全场景生效。

#### Scenario: 正常状态展示 idle 动画
- **WHEN** 宠物 mood ≥ 60 且 hunger ≥ 50，且无事件触发
- **THEN** 宠物展示 idle 表情 + idle 呼吸/眨眼动画

#### Scenario: 饥饿状态
- **WHEN** 宠物 hunger < 30
- **THEN** 宠物切换为 hungry 表情（嘴型与瞳孔变化）

#### Scenario: 事件触发 happy
- **WHEN** 收到 `event:completed` 或 `event:created` 事件
- **THEN** 宠物切换为 happy 表情，5 秒后恢复 idle

#### Scenario: 走路时开心表情并存
- **WHEN** 宠物在移动中（action=walk）且情绪为 happy（完成日程后）
- **THEN** 步伐动画与 happy 脸部表情同时呈现（动作与表情正交）

#### Scenario: 装备配饰叠加渲染
- **WHEN** 宠物装备「巫师帽」等叠加层类配饰
- **THEN** 配饰叠加层与基础形象同 viewBox 叠放（头部上方），动作动画与表情切换不受影响

#### Scenario: 皮肤滤镜渲染
- **WHEN** 宠物装备「年兽皮肤」等皮肤类配饰
- **THEN** 基础 SVG 应用对应 CSS filter（红色调），动作动画与表情切换不受影响

#### Scenario: 未装备不渲染装扮层
- **WHEN** 宠物未装备配饰（currentAccessory 为 null）
- **THEN** 不渲染装扮层，形象与装备功能上线前完全一致