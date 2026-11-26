# Pet Selection（初始选择）

## Purpose

宠物初始选择引导：新用户首次使用宠物功能时的引导流程——选择物种（橘猫/柴犬）并命名，创建宠物后进入正常展示状态。

## Requirements

### Requirement: 无宠物时展示选择界面
当用户无宠物（`GET /pets/me` 返回 404），系统 SHALL 在全局单实例 `PetSelection` 中展示橘猫/柴犬卡片与命名输入。首次无宠物且新手引导未遮挡、本会话尚未主动关闭过弹窗时自动弹出；主动关闭后本会话不再重弹且暂停 30s 轮询。

#### Scenario: 首次登录弹出选择
- **WHEN** 用户登录且 `useMyPet` 查询返回 404，且 `useShellStore.showOnboarding === false` 且本会话未关闭过选择框
- **THEN** 全局唯一的 `PetSelection` Dialog 自动打开，展示橘猫和柴犬两张卡片

#### Scenario: 选择物种并命名
- **WHEN** 用户点击橘猫卡片 + 输入名称"大橘" + 点击确认
- **THEN** `useCreatePet` mutation 发送 `{ species: "ORANGE_CAT", name: "大橘" }`，成功后面板展示宠物

#### Scenario: 名称非法
- **WHEN** 用户输入空名称或超过 30 字符
- **THEN** 确认按钮 disabled，显示校验提示

#### Scenario: 已有宠物时不弹出
- **WHEN** `useMyPet` 成功返回宠物数据
- **THEN** PetSelection Dialog 不显示，直接展示 PetPanel

#### Scenario: 主动关闭后本会话免打扰且停止 404 轮询
- **WHEN** 用户主动关闭 `PetSelection` Dialog 且 `useMyPet` 仍处于错误（404）状态
- **THEN** `petStore.selectionDismissed` 设为 `true`，不再自动重弹选择框，且 `useMyPet` 停止 30 秒周期轮询直到创建宠物成功或手动刷新
