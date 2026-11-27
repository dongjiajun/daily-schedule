# Pet Interaction UI Delta Specification

## ADDED Requirements

### Requirement: 宠物专页陈列台光影与响应式道具卡片网格

`/pet` 专页主卡 SHALL 在宠物头像背后渲染柔和主题径向光晕与脚底椭圆地面投影以增强空间层次，状态数值使用 `tabular-nums` 对齐；`FoodActionList` SHALL 支持 `layout`（`'list' | 'grid'`）布局，在 `/pet` 专页使用双列道具卡片网格，而在 `PetMenu` 浮层保留单列紧凑模式，并将 `PetMenu` 标签切换统一收敛至 `Segmented` 原语。

#### Scenario: 访问宠物专页查看陈列台与双列道具区

- **WHEN** 已拥有宠物的用户访问 `/pet` 专页
- **THEN** 宠物头像站在带柔和径向光晕与地面投影的陈列台上，喂食区与装扮区在桌面宽度以双列网格展示道具卡片

#### Scenario: 浮层菜单与专注币不足边界

- **WHEN** 用户打开窄浮层 `PetMenu` 或某道具价格高于当前专注币余额
- **THEN** `PetMenu` 以单列紧凑模式展示并通过 `Segmented` 切换「喂食 / 商店」，余额不足的道具按钮保持 `disabled` 并提示「专注币不足」
