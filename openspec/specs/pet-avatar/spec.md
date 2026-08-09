# Pet Avatar（宠物形象展示）

## Purpose
宠物形象是宠物模块的核心视觉组件，使用 SVG 程序化插画 + CSS 动画层渲染，根据 petStore 的 `action`（动作）与 `emotionState`（表情）双维状态切换视觉表现。

## Requirements

### Requirement: SVG 插画 + CSS 动画层渲染
系统 SHALL 使用 `SvgAvatar`（按 species 选择 `OrangeCat`/`ShibaInu` SVG 插画组件）渲染宠物形象，插画内嵌 CSS 动画层响应 petStore 的 `action` 与 `emotionState`：action 驱动连续动画（呼吸/眨眼/步伐/睡眠），emotionState 切换脸部参数（嘴型/眼睛/耳朵/尾巴角度）。

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

### Requirement: 连续动画（Action 驱动的 CSS 动画层）
SVG 插画 SHALL 内嵌 CSS 动画层，按 `data-action` 属性驱动连续动画：idle→呼吸循环 + 周期性眨眼（3-5s 一次）；walk→步伐摆动 + 身体起伏 + 前倾 5°；rest→下坐 + 尾巴慢摆；sleep→闭眼 + 蜷缩 + Zzz 循环气泡；jump→抛物线离地；eat→低头张嘴咀嚼 + 尾巴快摆；小动作（stretch/yawn/scratch/look）→播放一次后回 idle。

#### Scenario: idle 时呼吸与眨眼
- **WHEN** 宠物 action 为 `idle`
- **THEN** 身体持续呼吸（scaleY 1→1.02，3s 循环），眼睛周期性眨眼（4s 周期瞬时闭合）

#### Scenario: walk 时步伐动画
- **WHEN** 宠物 action 为 `walk`
- **THEN** 腿部交替摆动 + 身体轻微左右旋转（前倾 5° 基准），与移动速度匹配

#### Scenario: sleep 时睡眠表现
- **WHEN** 宠物 action 为 `sleep`
- **THEN** 身体蜷缩（scaleY 0.92）+ 闭眼 + 头部左上角 Zzz 气泡循环上飘淡出

#### Scenario: jump 时离地表现
- **WHEN** 宠物 action 为 `jump`
- **THEN** 身体向上抛物线位移，地面阴影同步缩小变淡，0.6s 后回落到 idle

#### Scenario: eat 时进食表现
- **WHEN** 宠物 action 为 `eat`（喂食/购买成功后触发，持续 1.5s）
- **THEN** 身体低头（rotate 8°）+ 嘴部开合咀嚼 + 尾巴快摆，1.5s 后自动回 idle

#### Scenario: 小动作播放一次后回 idle
- **WHEN** 宠物 action 为 `stretch` / `yawn` / `scratch` / `look`（idle 随机调度触发）
- **THEN** 对应动画播放一次（1.2-1.8s，`animation-iteration-count: 1`）后回 idle，不打断呼吸/眨眼基底

### Requirement: 进食动作 eat
宠物 SHALL 在喂食/购买成功时呈现进食动作（低头张嘴咀嚼），作为交互的即时视觉反馈。

#### Scenario: 喂食触发 eat
- **WHEN** 用户在互动菜单/宠物页执行喂食且后端返回成功
- **THEN** 宠物 action 切换为 `eat`（低头张嘴咀嚼 + 尾巴快摆），1.5s 后自动回 idle

#### Scenario: 购买触发 eat
- **WHEN** 用户在商店购买食物/道具成功
- **THEN** 宠物 SHALL 呈现进食动作作为成功反馈（与喂食同路径）

### Requirement: idle 小动作系统
宠物在 idle 状态 SHALL 周期性随机播放一次性小动作（伸懒腰 / 打哈欠 / 挠耳朵 / 东张西望），让静止形象"活"起来。

#### Scenario: idle 随机小动作
- **WHEN** 宠物处于 idle（未休息/未格内互动）且距上次小动作 8-18s
- **THEN** 随机选择一个小动作播放一次（1.2-1.8s），播放完回 idle

#### Scenario: 休息/格内不调度小动作
- **WHEN** 宠物处于休息（sleep/rest）或格内互动中
- **THEN** 不调度小动作，避免打断睡眠/格内状态

### Requirement: 情绪切换过渡
宠物情绪切换 SHALL 经一次眨眼过渡（约 50ms 闭眼换脸），消除瞬间"换脸"感。

#### Scenario: 情绪变化时眨眼过渡
- **WHEN** petStore 的 emotionState 变化
- **THEN** 眼睛先眨眼闭合（50ms），随后切换表情参数并睁开，过渡期间不闪帧

### Requirement: 地面影子
宠物形象 SHALL 在身体下方渲染地面阴影椭圆，随 action 变化：jump 时缩小变淡（离地感），其余动作常驻。

#### Scenario: 常驻阴影
- **WHEN** 宠物处于 idle/walk/rest/sleep/eat/小动作
- **THEN** 身体下方展示常驻阴影椭圆

#### Scenario: 跳跃时阴影变化
- **WHEN** 宠物 jump
- **THEN** 阴影缩小 30% 且透明度降低，模拟离地

### Requirement: 响应式尺寸
宠物形象 SHALL 在悬浮面板中为 100×100px，在详情页（PetPage）中为 200×200px，侧边栏迷你宠物为 40-50px。

#### Scenario: 悬浮面板小尺寸
- **WHEN** 在 RoamingPet hover 浮窗中渲染 PetAvatar
- **THEN** SVG 插画尺寸为 100×100px

#### Scenario: 详情页大尺寸
- **WHEN** 在 PetPage 中渲染 PetAvatar
- **THEN** SVG 插画尺寸为 200×200px
